import { AiConversation } from '../../../domain/aggregates/ai-conversation/ai-conversation.aggregate';
import type { AiConversationRepository } from '../../../domain/repositories/ai-conversation.repository';
import type { AiMessageRepository } from '../../../domain/repositories/ai-message.repository';
import type { AiConversationAccessService } from '../../services/ai-conversation-access.service';
import { toAiConversationTitle } from '../../services/ai-conversation-title';
import { ListConversationsHandler } from './list-conversations.handler';
import { ListConversationsQuery } from './list-conversations.query';

describe('AI Chat History titles', () => {
  it('normalizes and limits long Vietnamese first messages', () => {
    expect(toAiConversationTitle('  Taskmanly   giúp\nquản lý việc. ')).toBe(
      'Taskmanly giúp quản lý việc.',
    );
    expect(toAiConversationTitle('  ')).toBeNull();
    expect(Array.from(toAiConversationTitle('📋'.repeat(100))!).length).toBe(70);
    expect(toAiConversationTitle('📋'.repeat(100))?.endsWith('…')).toBe(true);
  });

  it('uses first USER messages only for untitled/generic chats and never overwrites custom titles', async () => {
    const legacy = AiConversation.create({
      id: 'generic-1', userId: 'user-1', workspaceId: 'workspace-1',
      title: 'AI Assistant',
    });
    const untitled = AiConversation.create({
      id: 'generic-2', userId: 'user-1', workspaceId: 'workspace-1',
    });
    const custom = AiConversation.create({
      id: 'custom-1', userId: 'user-1', workspaceId: 'workspace-1',
      title: 'My pinned release plan',
    });
    const findFirstUserContentsByConversationIds = jest.fn().mockResolvedValue(
      new Map([['generic-1', 'Fix the mobile layout'], ['generic-2', 'Create tasks']]),
    );
    const handler = new ListConversationsHandler(
      { findByUserId: jest.fn().mockResolvedValue([legacy, untitled, custom]) } as unknown as AiConversationRepository,
      { findFirstUserContentsByConversationIds } as unknown as AiMessageRepository,
      { canRead: jest.fn().mockResolvedValue(true) } as unknown as AiConversationAccessService,
    );
    const result = await handler.execute(new ListConversationsQuery('user-1'));
    expect(result.items.map((item) => item.title)).toEqual([
      'Fix the mobile layout',
      'Create tasks',
      'My pinned release plan',
    ]);
    expect(findFirstUserContentsByConversationIds).toHaveBeenCalledWith([
      'generic-1', 'generic-2',
    ]);
    expect(legacy.getTitle()).toBe('AI Assistant'); // Read-only presentation.
  });

  it('only fetches message titles for conversations that passed access control', async () => {
    const visible = AiConversation.create({
      id: 'visible', userId: 'user-1', workspaceId: 'workspace-1',
      title: 'AI Assistant',
    });
    const revoked = AiConversation.create({
      id: 'revoked', userId: 'user-1', workspaceId: 'workspace-2',
      title: 'AI Assistant',
    });
    const findFirstUserContentsByConversationIds = jest.fn().mockResolvedValue(
      new Map([['visible', 'Authorized content']]),
    );
    const handler = new ListConversationsHandler(
      { findByUserId: jest.fn().mockResolvedValue([visible, revoked]) } as unknown as AiConversationRepository,
      { findFirstUserContentsByConversationIds } as unknown as AiMessageRepository,
      { canRead: jest.fn(async (conv: AiConversation) => conv.getId() === 'visible') } as unknown as AiConversationAccessService,
    );
    const result = await handler.execute(new ListConversationsQuery('user-1'));
    expect(result.items).toHaveLength(1);
    expect(result.items[0].title).toBe('Authorized content');
    expect(findFirstUserContentsByConversationIds).toHaveBeenCalledWith(['visible']);
  });

  it('keeps the placeholder if the old conversation has no USER message', async () => {
    const chat = AiConversation.create({
      id: 'empty', userId: 'user-1', workspaceId: 'workspace-1',
      title: 'AI Assistant',
    });
    const handler = new ListConversationsHandler(
      { findByUserId: jest.fn().mockResolvedValue([chat]) } as unknown as AiConversationRepository,
      { findFirstUserContentsByConversationIds: jest.fn().mockResolvedValue(new Map()) } as unknown as AiMessageRepository,
      { canRead: jest.fn().mockResolvedValue(true) } as unknown as AiConversationAccessService,
    );
    const result = await handler.execute(new ListConversationsQuery('user-1'));
    expect(result.items[0].title).toBe('AI Assistant');
  });
});
