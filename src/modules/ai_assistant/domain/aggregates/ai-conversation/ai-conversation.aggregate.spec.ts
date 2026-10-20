import { AiConversationScope } from '../../enums/ai-conversation-scope.enum';
import { AiConversationStatus } from '../../enums/ai-conversation-status.enum';
import { AiConversation } from './ai-conversation.aggregate';

const params = { userId: 'user-1', workspaceId: 'workspace-1' };

describe('AiConversation scope', () => {
  it('defaults a new conversation to GLOBAL', () => {
    const conversation = AiConversation.create(params);
    expect(conversation.getScope()).toBe(AiConversationScope.GLOBAL);
    expect(conversation.getPageId()).toBeNull();
  });

  it('keeps PAGE context when archived', () => {
    const conversation = AiConversation.create({
      ...params,
      scope: AiConversationScope.PAGE,
      pageId: 'page-1',
    });
    conversation.archive();
    const updatedAt = conversation.getUpdatedAt();
    conversation.archive();
    expect(conversation.getStatus()).toBe(AiConversationStatus.ARCHIVED);
    expect(conversation.getPageId()).toBe('page-1');
    expect(conversation.getScope()).toBe(AiConversationScope.PAGE);
    expect(conversation.getUpdatedAt()).toBe(updatedAt);
  });

  it.each([null, undefined, ''])(
    'rejects PAGE without a page id (%s)',
    (pageId) => {
      expect(() =>
        AiConversation.create({
          ...params,
          scope: AiConversationScope.PAGE,
          pageId,
        }),
      ).toThrow('page id');
    },
  );

  it('rejects a page id on GLOBAL', () => {
    expect(() =>
      AiConversation.create({ ...params, pageId: 'page-1' }),
    ).toThrow('page id');
  });

  it('rejects new LEGACY conversations', () => {
    expect(() =>
      AiConversation.create({ ...params, scope: AiConversationScope.LEGACY }),
    ).toThrow('only be restored');
  });

  it('rejects new conversations without workspace', () => {
    expect(() => AiConversation.create({ userId: 'user-1' })).toThrow(
      'workspace id',
    );
  });

  it('restores pre-scope data as LEGACY without losing nullable fields or status', () => {
    const createdAt = new Date('2026-01-01');
    const conversation = AiConversation.restore({
      id: 'old-1',
      userId: 'user-1',
      workspaceId: null,
      title: 'Old chat',
      status: AiConversationStatus.ARCHIVED,
      createdAt,
      updatedAt: createdAt,
    });
    expect(conversation.getScope()).toBe(AiConversationScope.LEGACY);
    expect(conversation.getPageId()).toBeNull();
    expect(conversation.getWorkspaceId()).toBeNull();
    expect(conversation.getTitle()).toBe('Old chat');
    expect(conversation.getCreatedAt()).toBe(createdAt);
    expect(conversation.getStatus()).toBe(AiConversationStatus.ARCHIVED);
  });
});
