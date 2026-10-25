import { BadGatewayException, BadRequestException } from '@nestjs/common';
import { AiConversation } from '../../domain/aggregates/ai-conversation/ai-conversation.aggregate';
import { AiConversationScope } from '../../domain/enums/ai-conversation-scope.enum';
import { AiMessageRole } from '../../domain/enums/ai-message-role.enum';

import { AiGenerationStatus } from '../../domain/enums/ai-generation-status.enum';
import type { AiGenerationRepository } from '../../domain/repositories/ai-generation.repository';
import { AI_MODIFICATION_PLAN_CAPABILITY } from '../constants/ai-modification-plan.constant';
import type { AiPageContextResponseDto } from '../dto/response/ai-page-context.response.dto';
import type { AiRuntimePort, AiRuntimeResult } from '../ports/ai-runtime.port';
import { GetAiPageContextHandler } from '../queries/get-ai-page-context/get-ai-page-context.handler';
import { GetAiPageContextQuery } from '../queries/get-ai-page-context/get-ai-page-context.query';
import type { AiModificationPlan } from '../types/ai-modification-plan';
import { AiModificationPlanValidatorService } from './ai-modification-plan-validator.service';
import { AiModificationPlannerService } from './ai-modification-planner.service';
import { fingerprintAiPageContext } from './ai-page-context-fingerprint';

describe('AiModificationPlannerService', () => {
  it.each([
    'Xóa heading',
    'Sửa heading',
    'Rename page',
    'Dịch toàn bộ trang',
    'Thêm checklist rồi xóa block',
  ])(
    'blocks unsupported dedicated planner input before persistence/runtime: %s',
    async (instruction) => {
      const f = createService();
      const execute = jest.spyOn(f.runtime, 'execute');
      const save = jest.spyOn(f.generationRepository, 'save');
      await expect(
        f.service.generate({
          userId: 'user-1',
          pageId: 'page-1',
          requestId: 'r',
          instruction,
        }),
      ).rejects.toThrow('Unsupported AI modification operation');
      expect(execute).not.toHaveBeenCalled();
      expect(save).not.toHaveBeenCalled();
    },
  );
  it('rejects truncated context before persisting a draft or calling the model', async () => {
    const context = makeContext();
    context.completeness.textTruncated = true;
    const { service, generationRepository, runtime } = createService({ context });
    await expect(
      service.generate({
        requestId: 'request-incomplete',
        userId: 'user-1',
        pageId: 'page-1',
        instruction: 'Add a block',
      }),
    ).rejects.toThrow('Page context is incomplete');
    expect(generationRepository.save).not.toHaveBeenCalled();
    expect(runtime.execute).not.toHaveBeenCalled();
  });

  function makeContext(): AiPageContextResponseDto {
    return {
      schemaVersion: 1,
      builtAt: '2026-10-06T08:00:00.000Z',

      page: {
        id: 'page-1',
        workspaceId: 'workspace-1',
        teamspaceId: null,
        parentPageId: null,
        title: 'Release Plan',
        icon: null,
        coverUrl: null,
        updatedAt: '2026-10-06T07:00:00.000Z',
      },

      blocks: [],

      databaseReferences: [],

      databases: [],

      completeness: {
        blocks: {
          total: 0,
          included: 0,
          truncated: false,
        },

        databases: {
          total: 0,
          included: 0,
          truncated: false,
        },

        rows: [],

        textTruncated: false,
      },
    };
  }

  function makePlan(): AiModificationPlan {
    return {
      schemaVersion: 1,
      type: 'AI_MODIFICATION_PLAN',
      pageId: 'page-1',
      status: 'PLAN_READY',
      summary: 'Add a release note.',
      operations: [
        {
          type: 'INSERT_BLOCKS',
          parentBlockId: null,
          afterBlockId: null,
          blocks: [
            {
              type: 'TEXT',
              content: {
                text: 'Release note',
              },
            },
          ],
        },
      ],
    };
  }

  function makeNeedMoreContextPlan(): AiModificationPlan {
    return {
      schemaVersion: 1,
      type: 'AI_MODIFICATION_PLAN',
      pageId: 'page-1',
      status: 'NEED_MORE_CONTEXT',
      summary: 'More page context is required.',
      operations: [],
      contextRequests: [
        {
          reason: 'AMBIGUOUS_TARGET',
          description: 'The requested target is ambiguous.',
          question: 'Bạn muốn thêm nội dung vào vị trí nào?',
        },
      ],
    };
  }

  function createService(options?: {
    context?: AiPageContextResponseDto;
    runtimeResult?: AiRuntimeResult;
    validatedPlan?: AiModificationPlan;
  }) {
    const context = options?.context ?? makeContext();
    const validatedPlan = options?.validatedPlan ?? makePlan();

    const runtimeResult: AiRuntimeResult = options?.runtimeResult ?? {
      output: validatedPlan,
      provider: 'ollama',
      model: 'qwen3:4b-instruct',
    };

    const getAiPageContextHandler = {
      execute: jest.fn().mockResolvedValue(context),
    };

    const generationRepository: AiGenerationRepository = {
      save: jest.fn().mockImplementation(async (generation) => {
        lastGeneration = generation;
        return generation;
      }),
      findById: jest.fn(),
      findByIdAndUserId: jest.fn(),
      findByIdAndUserIdForUpdate: jest.fn(),
      findByConversationId: jest.fn(),
    };
    let lastGeneration: any;
    let lastConversation: AiConversation | null = null;
    const conversationRepository = {
      save: jest.fn(async (conversation: AiConversation) => {
        lastConversation = conversation;
        return conversation;
      }),
      findByIdAndUserId: jest.fn(async () => lastConversation),
    };
    const messageRepository = { save: jest.fn(async (message: any) => message) };
    const usageRepository = { save: jest.fn(async (usage: any) => usage) };
    const unitOfWork = {
      runInTransaction: jest.fn(async (fn: (context: any) => Promise<any>) => fn({})),
    };
    const accessService = { assertCanRead: jest.fn() };
    (generationRepository.findByIdAndUserId as jest.Mock).mockImplementation(
      async () => lastGeneration ?? null,
    );

    const runtime: AiRuntimePort = {
      execute: jest.fn().mockResolvedValue(runtimeResult),
    };

    const planValidator = {
      validate: jest.fn().mockReturnValue(validatedPlan),
    };

    const service = new AiModificationPlannerService(
      getAiPageContextHandler as unknown as GetAiPageContextHandler,
      conversationRepository as any,
      messageRepository as any,
      generationRepository,
      usageRepository as any,
      runtime,
      unitOfWork as any,
      accessService as any,
      planValidator as unknown as AiModificationPlanValidatorService,
    );

    return {
      service,
      context,
      validatedPlan,
      runtimeResult,
      getAiPageContextHandler,
      generationRepository,
      conversationRepository,
      messageRepository,
      usageRepository,
      unitOfWork,
      accessService,
      setConversation: (conversation: AiConversation) => {
        (conversationRepository.findByIdAndUserId as jest.Mock).mockResolvedValue(
          conversation,
        );
      },
      runtime,
      planValidator,
    };
  }

  it('builds authorized page context, calls runtime, validates output, and returns the plan with generationId', async () => {
    const {
      service,
      context,
      validatedPlan,
      runtime,
      planValidator,
      getAiPageContextHandler,
    } = createService();

    const result = await service.generate({
      requestId: 'request-1',
      userId: 'user-1',
      pageId: 'page-1',
      instruction: 'Thêm một release note.',
      shareToken: 'share-token-1',
    });

    expect(getAiPageContextHandler.execute).toHaveBeenCalledTimes(1);

    const contextQuery = getAiPageContextHandler.execute.mock.calls[0][0];

    expect(contextQuery).toBeInstanceOf(GetAiPageContextQuery);

    expect(contextQuery).toEqual(
      new GetAiPageContextQuery('user-1', 'page-1', 'share-token-1'),
    );

    expect(runtime.execute).toHaveBeenCalledTimes(1);

    expect(runtime.execute).toHaveBeenCalledWith({
      requestId: 'request-1',
      capability: AI_MODIFICATION_PLAN_CAPABILITY,
      content: 'Thêm một release note.',
      input: {},
      context: {
        ...context,
      },
    });

    expect(planValidator.validate).toHaveBeenCalledTimes(1);

    expect(planValidator.validate).toHaveBeenCalledWith(validatedPlan, context);

    expect(result).toEqual({
      conversationId: expect.any(String),
      generationId: expect.any(String),
      ...validatedPlan,
    });
  });

  it('persists the validated modification plan as a completed generation', async () => {
    const { service, context, validatedPlan, generationRepository } =
      createService();

    const result = await service.generate({
      requestId: 'request-persist-1',
      userId: 'user-1',
      pageId: 'page-1',
      instruction: 'Thêm một release note.',
    });

    expect(generationRepository.save).toHaveBeenCalledTimes(2);

    const generation = (generationRepository.save as jest.Mock).mock
      .calls[0][0];

    expect(generation.getConversationId()).toEqual(expect.any(String));

    expect(generation.getUserId()).toBe('user-1');

    expect(generation.getWorkspaceId()).toBe(context.page.workspaceId);

    expect(generation.getCapability()).toBe(AI_MODIFICATION_PLAN_CAPABILITY);

    expect(generation.getStatus()).toBe(AiGenerationStatus.COMPLETED);

    expect(generation.getInputData()).toEqual({
      pageId: context.page.id,
      instruction: 'Thêm một release note.',
      requestId: 'request-persist-1',
      pageContextFingerprint: fingerprintAiPageContext(context),
    });

    expect(generation.getOutputData()).toEqual(validatedPlan);

    expect(generation.getProvider()).toBe('ollama');

    expect(generation.getModel()).toBe('qwen3:4b-instruct');

    expect((result as unknown as { generationId: string }).generationId).toBe(
      generation.getId(),
    );
  });

  it('persists NEED_MORE_CONTEXT as a completed generation', async () => {
    const validatedPlan = makeNeedMoreContextPlan();

    const { service, generationRepository } = createService({
      validatedPlan,
      runtimeResult: {
        output: validatedPlan,
        provider: 'ollama',
        model: 'qwen3:4b-instruct',
      },
    });

    const result = await service.generate({
      requestId: 'request-context-1',
      userId: 'user-1',
      pageId: 'page-1',
      instruction: 'Thêm nội dung phù hợp.',
    });

    expect(result).toEqual({
      conversationId: expect.any(String),
      generationId: expect.any(String),
      ...validatedPlan,
    });

    expect(generationRepository.save).toHaveBeenCalledTimes(2);

    const generation = (generationRepository.save as jest.Mock).mock
      .calls[0][0];

    expect(generation.getStatus()).toBe(AiGenerationStatus.COMPLETED);

    expect(generation.getOutputData()).toEqual(validatedPlan);

    expect((result as unknown as { generationId: string }).generationId).toBe(
      generation.getId(),
    );
  });

  it('reuses an existing PAGE conversation and correlates both messages with the generation', async () => {
    const f = createService();
    const conversation = AiConversation.create({
      id: 'existing-page-thread',
      userId: 'user-1',
      workspaceId: 'workspace-1',
      scope: AiConversationScope.PAGE,
      pageId: 'page-1',
    });
    f.setConversation(conversation);
    const result = await f.service.generate({
      requestId: 'reuse-1',
      userId: 'user-1',
      pageId: 'page-1',
      instruction: 'Add tasks',
      conversationId: conversation.getId(),
    });
    expect(result.conversationId).toBe('existing-page-thread');
    expect(f.conversationRepository.save).not.toHaveBeenCalled();
    expect(f.accessService.assertCanRead).toHaveBeenCalledTimes(2);
    expect(f.messageRepository.save).toHaveBeenCalledTimes(2);
    const userMessage = (f.messageRepository.save as jest.Mock).mock.calls[0][0];
    const assistantMessage = (f.messageRepository.save as jest.Mock).mock.calls[1][0];
    expect(userMessage.getRole()).toBe(AiMessageRole.USER);
    expect(assistantMessage.getRole()).toBe(AiMessageRole.ASSISTANT);
    expect(userMessage.getMetadata().generationId).toBe(result.generationId);
    expect(assistantMessage.getMetadata().generationId).toBe(result.generationId);
    expect(userMessage.getConversationId()).toBe(result.conversationId);
  });

  it('keeps the original wording in history while planning with the extracted instruction', async () => {
    const f = createService();
    const original = 'add checklist vào trang "Release Plan" nhé';
    await f.service.generate({
      requestId: 'original-1',
      userId: 'user-1',
      pageId: 'page-1',
      instruction: 'Thêm một release note.',
      originalInstruction: original,
    });
    const conversation = (f.conversationRepository.save as jest.Mock).mock.calls[0][0];
    const userMessage = (f.messageRepository.save as jest.Mock).mock.calls[0][0];
    const generation = (f.generationRepository.save as jest.Mock).mock.calls[0][0];
    expect(conversation.getTitle()).toBe(original);
    expect(userMessage.getContent()).toBe(original);
    expect(generation.getInputData().instruction).toBe('Thêm một release note.');
    expect(f.runtime.execute).toHaveBeenCalledWith(
      expect.objectContaining({ content: 'Thêm một release note.' }),
    );
  });

  it('rejects a conversation belonging to another page before persisting history', async () => {
    const f = createService();
    f.setConversation(AiConversation.create({
      id: 'other-page-thread',
      userId: 'user-1',
      workspaceId: 'workspace-1',
      scope: AiConversationScope.PAGE,
      pageId: 'other-page',
    }));
    await expect(f.service.generate({
      requestId: 'wrong-page',
      userId: 'user-1',
      pageId: 'page-1',
      instruction: 'Add tasks',
      conversationId: 'other-page-thread',
    })).rejects.toThrow('AI page conversation not found');
    expect(f.runtime.execute).not.toHaveBeenCalled();
    expect(f.messageRepository.save).not.toHaveBeenCalled();
  });

  it('persists a failed generation and user message when runtime fails', async () => {
    const f = createService();
    (f.runtime.execute as jest.Mock).mockRejectedValue(new Error('Runtime unavailable'));
    await expect(f.service.generate({
      requestId: 'failed-plan',
      userId: 'user-1',
      pageId: 'page-1',
      instruction: 'Add tasks',
    })).rejects.toThrow('Runtime unavailable');
    expect(f.generationRepository.save).toHaveBeenCalledTimes(2);
    expect(f.messageRepository.save).toHaveBeenCalledTimes(1);
    const failed = (f.generationRepository.save as jest.Mock).mock.calls[1][0];
    expect(failed.getStatus()).toBe(AiGenerationStatus.FAILED);
    expect(failed.getErrorCode()).toBe('AI_MODIFICATION_PLAN_ERROR');
  });

  it('does not build context or call runtime when instruction is blank', async () => {
    const {
      service,
      runtime,
      planValidator,
      getAiPageContextHandler,
      generationRepository,
    } = createService();

    await expect(
      service.generate({
        requestId: 'request-2',
        userId: 'user-1',
        pageId: 'page-1',
        instruction: '   ',
      }),
    ).rejects.toThrow(
      new BadRequestException('AI modification plan instruction is required'),
    );

    expect(getAiPageContextHandler.execute).not.toHaveBeenCalled();

    expect(runtime.execute).not.toHaveBeenCalled();

    expect(planValidator.validate).not.toHaveBeenCalled();

    expect(generationRepository.save).not.toHaveBeenCalled();
  });

  it('propagates context loading errors without calling runtime', async () => {
    const {
      service,
      runtime,
      planValidator,
      getAiPageContextHandler,
      generationRepository,
    } = createService();

    const contextError = new BadRequestException('Page context failed');

    getAiPageContextHandler.execute.mockRejectedValue(contextError);

    await expect(
      service.generate({
        requestId: 'request-3',
        userId: 'user-1',
        pageId: 'page-1',
        instruction: 'Thêm task.',
      }),
    ).rejects.toBe(contextError);

    expect(runtime.execute).not.toHaveBeenCalled();

    expect(planValidator.validate).not.toHaveBeenCalled();

    expect(generationRepository.save).not.toHaveBeenCalled();
  });

  it('propagates runtime errors without invoking the validator', async () => {
    const { service, runtime, planValidator, generationRepository } =
      createService();

    const runtimeError = new Error('AI runtime unavailable');

    (
      runtime.execute as jest.MockedFunction<AiRuntimePort['execute']>
    ).mockRejectedValue(runtimeError);

    await expect(
      service.generate({
        requestId: 'request-4',
        userId: 'user-1',
        pageId: 'page-1',
        instruction: 'Thêm task.',
      }),
    ).rejects.toBe(runtimeError);

    expect(planValidator.validate).not.toHaveBeenCalled();

    expect(generationRepository.save).toHaveBeenCalledTimes(2);
  });

  it('propagates validator errors after runtime returns output', async () => {
    const { service, runtime, planValidator, generationRepository } =
      createService();

    const validationError = new BadGatewayException(
      'Invalid AI modification plan',
    );

    planValidator.validate.mockImplementation(() => {
      throw validationError;
    });

    await expect(
      service.generate({
        requestId: 'request-5',
        userId: 'user-1',
        pageId: 'page-1',
        instruction: 'Thêm task.',
      }),
    ).rejects.toBe(validationError);

    expect(runtime.execute).toHaveBeenCalledTimes(1);

    expect(planValidator.validate).toHaveBeenCalledTimes(1);

    expect(generationRepository.save).toHaveBeenCalledTimes(2);
  });
});
