import { Test, TestingModule } from '@nestjs/testing';

import type { IAuth } from 'src/types/auth';

import { ArchiveConversationHandler } from '../../../application/commands/archive-conversation/archive-conversation.handler';

import { CreateConversationHandler } from '../../../application/commands/create-conversation/create-conversation.handler';
import { DiscardGenerationHandler } from '../../../application/commands/discard-generation/discard-generation.handler';

import { GetConversationHandler } from '../../../application/queries/get-conversation/get-conversation.handler';
import { GetGenerationHandler } from '../../../application/queries/get-generation/get-generation.handler';
import { ListConversationMessagesHandler } from '../../../application/queries/list-conversation-messages/list-conversation-messages.handler';
import { ListConversationsHandler } from '../../../application/queries/list-conversations/list-conversations.handler';

import { AiAssistantService } from '../../../application/services/ai-assistant.service';
import { AiModificationPlannerService } from '../../../application/services/ai-modification-planner.service';

import { ConfirmGenerationHandler } from '../../../application/commands/confirm-generation/confirm-generation.handler';
import { AiAssistantController } from './ai-assistant.controller';

describe('AiAssistantController', () => {
  const createConversationExecute = jest.fn();
  const archiveConversationExecute = jest.fn();
  const listConversationsExecute = jest.fn();
  const getConversationExecute = jest.fn();
  const listConversationMessagesExecute = jest.fn();
  const getGenerationExecute = jest.fn();
  const discardGenerationExecute = jest.fn();

  const aiAssistantSubmit = jest.fn();
  const modificationPlannerGenerate = jest.fn();

  let controller: AiAssistantController;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AiAssistantController],
      providers: [
        {
          provide: CreateConversationHandler,
          useValue: {
            execute: createConversationExecute,
          },
        },
        {
          provide: ArchiveConversationHandler,
          useValue: {
            execute: archiveConversationExecute,
          },
        },
        {
          provide: ListConversationsHandler,
          useValue: {
            execute: listConversationsExecute,
          },
        },
        {
          provide: GetConversationHandler,
          useValue: {
            execute: getConversationExecute,
          },
        },
        {
          provide: ListConversationMessagesHandler,
          useValue: {
            execute: listConversationMessagesExecute,
          },
        },
        {
          provide: GetGenerationHandler,
          useValue: {
            execute: getGenerationExecute,
          },
        },
        {
          provide: AiAssistantService,
          useValue: {
            submit: aiAssistantSubmit,
          },
        },
        {
          provide: DiscardGenerationHandler,
          useValue: {
            execute: discardGenerationExecute,
          },
        },
        {
          provide: AiModificationPlannerService,
          useValue: {
            generate: modificationPlannerGenerate,
          },
        },
        {
          provide: ConfirmGenerationHandler,
          useValue: {
            execute: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get(AiAssistantController);
  });

  it('is defined', () => {
    expect(controller).toBeDefined();
  });

  describe('generateModificationPlan', () => {
    it('maps authenticated HTTP input to the modification planner service', async () => {
      const plan = {
        generationId: 'generation-1',
        schemaVersion: 1,
        type: 'AI_MODIFICATION_PLAN',
        pageId: 'page-1',
        status: 'PLAN_READY',
        summary: 'Add a release note.',
        operations: [],
      };

      modificationPlannerGenerate.mockResolvedValue(plan);

      const result = await controller.generateModificationPlan(
        {
          id: 'user-1',
        } as IAuth,
        'page-1',
        {
          requestId: '550e8400-e29b-41d4-a716-446655440000',
          instruction: 'Thêm một release note.',
        },
        'share-token-1',
      );

      expect(modificationPlannerGenerate).toHaveBeenCalledTimes(1);

      expect(modificationPlannerGenerate).toHaveBeenCalledWith({
        requestId: '550e8400-e29b-41d4-a716-446655440000',
        userId: 'user-1',
        pageId: 'page-1',
        instruction: 'Thêm một release note.',
        shareToken: 'share-token-1',
      });

      expect(result).toBe(plan);
    });

    it('generates a request ID when the client does not provide one', async () => {
      modificationPlannerGenerate.mockResolvedValue({
        status: 'PLAN_READY',
      });

      await controller.generateModificationPlan(
        {
          id: 'user-1',
        } as IAuth,
        'page-1',
        {
          instruction: 'Thêm task mới.',
        },
        undefined,
      );

      expect(modificationPlannerGenerate).toHaveBeenCalledTimes(1);

      expect(modificationPlannerGenerate).toHaveBeenCalledWith({
        requestId: expect.stringMatching(
          /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
        ),
        userId: 'user-1',
        pageId: 'page-1',
        instruction: 'Thêm task mới.',
        shareToken: undefined,
      });
    });

    it('propagates planner service errors', async () => {
      const error = new Error('Modification planner failed');

      modificationPlannerGenerate.mockRejectedValue(error);

      await expect(
        controller.generateModificationPlan(
          {
            id: 'user-1',
          } as IAuth,
          'page-1',
          {
            instruction: 'Thêm task.',
          },
          undefined,
        ),
      ).rejects.toBe(error);
    });
  });
});
