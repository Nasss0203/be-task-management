import { NotFoundException } from '@nestjs/common';
import type { AuthorizationService } from 'src/modules/permission/application/services/authorization.service';
import type { PageRepository } from 'src/modules/content/domain/repositories/page.repository';
import type { GetAiPageContextHandler } from './queries/get-ai-page-context/get-ai-page-context.handler';
import type { AiModificationPlanValidatorService } from './services/ai-modification-plan-validator.service';
import { AiConversationAccessService } from './services/ai-conversation-access.service';
import { ArchiveConversationCommand } from './commands/archive-conversation/archive-conversation.command';
import { ArchiveConversationHandler } from './commands/archive-conversation/archive-conversation.handler';
import { RecordAiUsageCommand } from './commands/record-ai-usage/record-ai-usage.command';
import { RecordAiUsageHandler } from './commands/record-ai-usage/record-ai-usage.handler';
import { GetConversationHandler } from './queries/get-conversation/get-conversation.handler';
import { GetConversationQuery } from './queries/get-conversation/get-conversation.query';
import { GetGenerationHandler } from './queries/get-generation/get-generation.handler';
import { GetGenerationQuery } from './queries/get-generation/get-generation.query';
import { ListConversationsHandler } from './queries/list-conversations/list-conversations.handler';
import { ListConversationsQuery } from './queries/list-conversations/list-conversations.query';
import { AiConversation } from '../domain/aggregates/ai-conversation/ai-conversation.aggregate';
import type { AiConversationRepository } from '../domain/repositories/ai-conversation.repository';
import type { AiMessageRepository } from '../domain/repositories/ai-message.repository';
import type { AiGenerationRepository } from '../domain/repositories/ai-generation.repository';
import type { AiUsageRepository } from '../domain/repositories/ai-usage.repository';

const authorizationService = {
  authorize: jest.fn().mockResolvedValue(true),
} as unknown as AuthorizationService;

const createConversation = (userId = 'user-1') =>
  AiConversation.create({
    id: 'conversation-1',
    userId,
    workspaceId: 'workspace-1',
  });

const accessService = new AiConversationAccessService(
  { findById: jest.fn() } as unknown as PageRepository,
  authorizationService,
);

describe('AI Assistant application authorization', () => {
  beforeEach(() => jest.clearAllMocks());

  it('scopes conversation lookup to the current actor', async () => {
    const findByIdAndUserId = jest.fn().mockResolvedValue(null);
    const repository = {
      findByIdAndUserId,
    } as unknown as AiConversationRepository;
    const handler = new GetConversationHandler(repository, accessService);

    await expect(
      handler.execute(new GetConversationQuery('user-2', 'conversation-1')),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(findByIdAndUserId).toHaveBeenCalledWith('conversation-1', 'user-2');
  });

  it('lists conversations only through the current user scope', async () => {
    const findByUserId = jest
      .fn()
      .mockResolvedValue([createConversation('user-1')]);
    const repository = {
      findByUserId,
    } as unknown as AiConversationRepository;
    const handler = new ListConversationsHandler(
      repository,
      {
        findFirstUserContentsByConversationIds: jest.fn().mockResolvedValue(
          new Map([['conversation-1', '  Plan   the   release\nchecklist  ']]),
        ),
      } as unknown as AiMessageRepository,
      accessService,
    );

    const result = await handler.execute(new ListConversationsQuery('user-1'));

    expect(findByUserId).toHaveBeenCalledWith('user-1', {
      limit: 31,
      cursor: undefined,
    });
    expect(result.items).toHaveLength(1);
    expect(result.items[0].title).toBe('Plan the release checklist');
    expect(result.nextCursor).toBeNull();
  });

  it('does not archive a conversation owned by another user', async () => {
    const findByIdAndUserId = jest.fn().mockResolvedValue(null);
    const save = jest.fn();
    const repository = {
      findByIdAndUserId,
      save,
    } as unknown as AiConversationRepository;
    const handler = new ArchiveConversationHandler(repository, accessService);

    await expect(
      handler.execute(
        new ArchiveConversationCommand('user-2', 'conversation-1'),
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(save).not.toHaveBeenCalled();
  });

  it('rejects invalid usage before persistence', () => {
    const save = jest.fn();
    const repository = { save } as unknown as AiUsageRepository;
    const handler = new RecordAiUsageHandler(repository);

    expect(() =>
      handler.execute(
        new RecordAiUsageCommand(
          'user-1',
          null,
          null,
          null,
          'TEST',
          'test-model',
          -1,
          0,
          0,
        ),
      ),
    ).toThrow('must be a non-negative integer');
    expect(save).not.toHaveBeenCalled();
  });

  it('scopes generation lookup to the current actor', async () => {
    const findByIdAndUserId = jest.fn().mockResolvedValue(null);
    const repository = {
      findByIdAndUserId,
    } as unknown as AiGenerationRepository;
    const handler = new GetGenerationHandler(
      repository,
      authorizationService,
      { execute: jest.fn() } as unknown as GetAiPageContextHandler,
      { validate: jest.fn() } as unknown as AiModificationPlanValidatorService,
    );

    await expect(
      handler.execute(new GetGenerationQuery('user-2', 'generation-1')),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(findByIdAndUserId).toHaveBeenCalledWith('generation-1', 'user-2');
  });
});
