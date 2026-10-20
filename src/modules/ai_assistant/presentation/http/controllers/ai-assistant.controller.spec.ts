import { Test, TestingModule } from '@nestjs/testing';

import type { IAuth } from 'src/types/auth';
import { AiConversationScope } from '../../../domain/enums/ai-conversation-scope.enum';

import { ArchiveConversationHandler } from '../../../application/commands/archive-conversation/archive-conversation.handler';

import { CreateConversationHandler } from '../../../application/commands/create-conversation/create-conversation.handler';
import { DiscardGenerationHandler } from '../../../application/commands/discard-generation/discard-generation.handler';

import { GetConversationHandler } from '../../../application/queries/get-conversation/get-conversation.handler';
import { GetGenerationHandler } from '../../../application/queries/get-generation/get-generation.handler';
import { ListConversationMessagesHandler } from '../../../application/queries/list-conversation-messages/list-conversation-messages.handler';
import { ListConversationGenerationsHandler } from '../../../application/queries/list-conversation-generations/list-conversation-generations.handler';
import { ListConversationsHandler } from '../../../application/queries/list-conversations/list-conversations.handler';

import { AiAssistantService } from '../../../application/services/ai-assistant.service';
import { AiModificationPlannerService } from '../../../application/services/ai-modification-planner.service';
import { AiPageInstructionPlannerService } from '../../../application/services/ai-page-instruction-planner.service';
import { PageReferenceResolver } from '../../../application/resolution/page-reference-resolver.service';
import { PageIntentExtractionService } from '../../../application/resolution/page-intent-extraction.service';

import { ConfirmGenerationHandler } from '../../../application/commands/confirm-generation/confirm-generation.handler';
import { AiAssistantController } from './ai-assistant.controller';

describe('AiAssistantController', () => {
  const createConversationExecute = jest.fn();
  const archiveConversationExecute = jest.fn();
  const listConversationsExecute = jest.fn();
  const getConversationExecute = jest.fn();
  const listConversationMessagesExecute = jest.fn();
  const listConversationGenerationsExecute = jest.fn();
  const getGenerationExecute = jest.fn();
  const discardGenerationExecute = jest.fn();

  const aiAssistantSubmit = jest.fn();
  const modificationPlannerGenerate = jest.fn();
  const pageResolve = jest.fn();
  const extractIntent = jest.fn();
  const planPageInstruction = jest.fn();

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
          provide: ListConversationGenerationsHandler,
          useValue: {
            execute: listConversationGenerationsExecute,
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
        { provide: PageReferenceResolver, useValue: { resolve: pageResolve } },
        { provide: PageIntentExtractionService, useValue: { extract: extractIntent } },
        { provide: AiPageInstructionPlannerService, useValue: { generate: planPageInstruction } },
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

  it('routes natural-language planning with authenticated identity and share token', async () => {
    planPageInstruction.mockResolvedValue({ status: 'NEEDS_CLARIFICATION' });
    const result = await controller.generatePagePlanFromInstruction(
      { id: 'actor-1' } as IAuth,
      {
        workspaceId: 'workspace-1',
        instruction: 'Thêm checklist QA vào page Release 2.0',
        currentPageId: 'other-page',
        conversationId: 'conversation-1',
        requestId: 'request-1',
      },
      'share-token-1',
    );
    expect(result).toEqual({ status: 'NEEDS_CLARIFICATION' });
    expect(planPageInstruction).toHaveBeenCalledWith({
      userId: 'actor-1',
      workspaceId: 'workspace-1',
      instruction: 'Thêm checklist QA vào page Release 2.0',
      currentPageId: 'other-page',
      conversationId: 'conversation-1',
      requestId: 'request-1',
      shareToken: 'share-token-1',
    });
    expect(pageResolve).not.toHaveBeenCalled();
    expect(modificationPlannerGenerate).not.toHaveBeenCalled();
  });

  it('generates an id for natural-language planning when absent', async () => {
    await controller.generatePagePlanFromInstruction(
      { id: 'actor-1' } as IAuth,
      { workspaceId: 'workspace-1', instruction: 'Thêm vào page Release 2.0' },
    );
    expect(planPageInstruction).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'actor-1',
        requestId: expect.stringMatching(
          /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
        ),
      }),
    );
  });

  it('only extracts intent without invoking page resolution or planner', async () => {
    extractIntent.mockResolvedValue({ result: { intent: 'OTHER' } });
    await controller.extractPageIntent(
      { id: 'user-1' } as IAuth,
      { instruction: 'Thêm heading vào page Release 2.0' },
    );
    expect(extractIntent).toHaveBeenCalledWith('Thêm heading vào page Release 2.0');
    expect(pageResolve).not.toHaveBeenCalled();
    expect(modificationPlannerGenerate).not.toHaveBeenCalled();
  });

  it('resolves pages only for the authenticated actor and passes explicit scope', async () => {
    pageResolve.mockResolvedValue({ status: 'NOT_FOUND', candidates: [] });
    await controller.resolvePage(
      { id: 'user-1' } as IAuth,
      { workspaceId: 'workspace-1', title: 'Release 2.0' },
      'share-token',
    );
    expect(pageResolve).toHaveBeenCalledWith({
      userId: 'user-1', workspaceId: 'workspace-1', title: 'Release 2.0',
      currentPageId: undefined, shareToken: 'share-token',
    });
  });

  it('uses the authenticated actor and forwards PAGE context and share token', async () => {
    await controller.createConversation(
      { id: 'user-1' } as IAuth,
      { scope: AiConversationScope.PAGE, pageId: 'page-1' },
      'token',
    );
    expect(createConversationExecute).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        workspaceId: null,
        title: null,
        scope: AiConversationScope.PAGE,
        pageId: 'page-1',
        shareToken: 'token',
      }),
    );
  });

  it('keeps the old create payload compatible using GLOBAL scope', async () => {
    await controller.createConversation({ id: 'user-1' } as IAuth, {
      workspaceId: 'workspace-1',
      title: 'AI Assistant',
    });
    expect(createConversationExecute).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        workspaceId: 'workspace-1',
        scope: AiConversationScope.GLOBAL,
        pageId: null,
      }),
    );
  });

  it('keeps share tokens out of repository list filters', async () => {
    await controller.listConversations({ id: 'user-1' } as IAuth, {
      pageId: 'page-1',
      scope: AiConversationScope.PAGE,
      shareToken: 'token',
    });
    expect(listConversationsExecute).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        filters: { pageId: 'page-1', scope: AiConversationScope.PAGE },
        shareToken: 'token',
      }),
    );
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
