import { NotFoundException } from '@nestjs/common';
import { AiConversation } from '../../../domain/aggregates/ai-conversation/ai-conversation.aggregate';
import { AiGeneration } from '../../../domain/aggregates/ai-generation/ai-generation.aggregate';
import { AiConversationScope } from '../../../domain/enums/ai-conversation-scope.enum';
import type { AiConversationRepository } from '../../../domain/repositories/ai-conversation.repository';
import type { AiGenerationRepository } from '../../../domain/repositories/ai-generation.repository';
import { AiConversationAccessService } from '../../services/ai-conversation-access.service';
import { decodeAiHistoryCursor } from '../ai-history-cursor';
import { ListConversationGenerationsHandler } from './list-conversation-generations.handler';
import { ListConversationGenerationsQuery } from './list-conversation-generations.query';

describe('ListConversationGenerationsHandler', () => {
  const conversation = AiConversation.create({
    userId: 'user-1', workspaceId: 'workspace-1',
    scope: AiConversationScope.PAGE, pageId: 'page-1',
  });
  const createGeneration = (id: string) => {
    const generation = AiGeneration.create({
      id, conversationId: conversation.getId(), userId: 'user-1',
      workspaceId: 'workspace-1', capability: 'CHAT',
    });
    generation.complete({ outputData: { text: 'Hello' } });
    return generation;
  };

  const makeFixture = () => {
    const findByIdAndUserId = jest.fn().mockResolvedValue(conversation);
    const findPageByConversationId = jest.fn().mockResolvedValue([]);
    const assertCanRead = jest.fn().mockResolvedValue(undefined);
    const handler = new ListConversationGenerationsHandler(
      { findByIdAndUserId } as unknown as AiConversationRepository,
      { findPageByConversationId } as unknown as AiGenerationRepository,
      { assertCanRead } as unknown as AiConversationAccessService,
    );
    return { handler, findByIdAndUserId, findPageByConversationId, assertCanRead };
  };

  it('paginates generations and produces a reusable cursor', async () => {
    const f = makeFixture();
    const generations = [
      createGeneration('550e8400-e29b-41d4-a716-446655440001'),
      createGeneration('550e8400-e29b-41d4-a716-446655440002'),
    ];
    f.findPageByConversationId.mockResolvedValue(generations);
    const result = await f.handler.execute(new ListConversationGenerationsQuery(
      'user-1', conversation.getId(), { limit: 1 }, 'share-token',
    ));
    expect(result.items).toHaveLength(1);
    expect(result.items[0].conversation_id).toBe(conversation.getId());
    expect(result.nextCursor).toBeTruthy();
    expect(decodeAiHistoryCursor(result.nextCursor!).id).toBe(generations[0].getId());
    expect(f.findPageByConversationId).toHaveBeenCalledWith(conversation.getId(), {
      limit: 2, cursor: undefined,
    });
    expect(f.assertCanRead).toHaveBeenCalledWith(conversation, 'user-1', 'share-token');
  });

  it('blocks reads if the conversation is not owned or available', async () => {
    const f = makeFixture();
    f.findByIdAndUserId.mockResolvedValue(null);
    await expect(f.handler.execute(new ListConversationGenerationsQuery(
      'other-user', conversation.getId(),
    ))).rejects.toBeInstanceOf(NotFoundException);
    expect(f.findPageByConversationId).not.toHaveBeenCalled();
  });
});
