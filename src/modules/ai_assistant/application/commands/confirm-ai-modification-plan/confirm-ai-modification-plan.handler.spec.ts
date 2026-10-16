import { BadRequestException, ForbiddenException } from '@nestjs/common';

import { PageBlockType } from 'src/modules/content/domain/entities/page-block.entity';

import { PERMISSIONS } from 'src/modules/permission/constants/permission.constant';
import type { AuthorizationService } from 'src/modules/permission/application/services/authorization.service';

import type { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';
import type { UnitOfWork } from 'src/shared/infrastructure/persistence/unit-of-work.interface';

import { AiGenerationStatus } from '../../../domain/enums/ai-generation-status.enum';
import type { AiGenerationRepository } from '../../../domain/repositories/ai-generation.repository';

import { AI_MODIFICATION_PLAN_CAPABILITY } from '../../constants/ai-modification-plan.constant';
import type { AiPageContextResponseDto } from '../../dto/response/ai-page-context.response.dto';

import type { GetAiPageContextHandler } from '../../queries/get-ai-page-context/get-ai-page-context.handler';

import type { AiModificationPlanExecutor } from '../../services/ai-modification-plan-executor.service';
import type { AiModificationPlanValidatorService } from '../../services/ai-modification-plan-validator.service';

import type { ApplyGenerationHandler } from '../apply-generation/apply-generation.handler';

import { ConfirmAiModificationPlanCommand } from './confirm-ai-modification-plan.command';
import { ConfirmAiModificationPlanHandler } from './confirm-ai-modification-plan.handler';

describe('ConfirmAiModificationPlanHandler', () => {
  const context = {
    transaction: 'test-context',
  } as unknown as PersistenceContext;

  const pageContext = {
    page: {
      id: 'page-1',
      workspaceId: 'workspace-1',
      teamspaceId: null,
    },
  } as unknown as AiPageContextResponseDto;

  let generationRepository: {
    findByIdAndUserId: jest.Mock;
  };

  let authorizationService: {
    authorize: jest.Mock;
  };

  let getAiPageContextHandler: {
    execute: jest.Mock;
  };

  let planValidator: {
    validate: jest.Mock;
  };

  let planExecutor: {
    execute: jest.Mock;
  };

  let applyGenerationHandler: {
    execute: jest.Mock;
  };

  let unitOfWork: {
    runInTransaction: jest.Mock;
  };

  let handler: ConfirmAiModificationPlanHandler;

  const generation = {
    getCapability: jest.fn().mockReturnValue(AI_MODIFICATION_PLAN_CAPABILITY),
    getStatus: jest.fn().mockReturnValue(AiGenerationStatus.COMPLETED),
    getInputData: jest.fn().mockReturnValue({
      pageId: 'page-1',
      instruction: 'Add tasks',
    }),
    getOutputData: jest.fn().mockReturnValue({
      stored: 'plan',
    }),
    getWorkspaceId: jest.fn().mockReturnValue('workspace-1'),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    generationRepository = {
      findByIdAndUserId: jest.fn().mockResolvedValue(generation),
    };

    authorizationService = {
      authorize: jest.fn().mockResolvedValue(true),
    };

    getAiPageContextHandler = {
      execute: jest.fn().mockResolvedValue(pageContext),
    };

    planValidator = {
      validate: jest.fn(),
    };

    planExecutor = {
      execute: jest.fn(),
    };

    applyGenerationHandler = {
      execute: jest.fn(),
    };

    unitOfWork = {
      runInTransaction: jest.fn(
        async (
          fn: (context: PersistenceContext) => Promise<unknown>,
        ): Promise<unknown> => fn(context),
      ),
    };

    handler = new ConfirmAiModificationPlanHandler(
      generationRepository as unknown as AiGenerationRepository,
      authorizationService as unknown as AuthorizationService,
      getAiPageContextHandler as unknown as GetAiPageContextHandler,
      planValidator as unknown as AiModificationPlanValidatorService,
      planExecutor as unknown as AiModificationPlanExecutor,
      applyGenerationHandler as unknown as ApplyGenerationHandler,
      unitOfWork as unknown as UnitOfWork,
    );
  });

  it('executes a ready plan and applies the generation after authorization', async () => {
    const plan = {
      schemaVersion: 1 as const,
      type: 'AI_MODIFICATION_PLAN' as const,
      pageId: 'page-1',
      status: 'PLAN_READY' as const,
      summary: 'Add blocks and rows',
      operations: [
        {
          type: 'INSERT_BLOCKS' as const,
          parentBlockId: null,
          afterBlockId: null,
          blocks: [
            {
              type: PageBlockType.TEXT,
              content: {
                text: 'New block',
              },
            },
          ],
        },
        {
          type: 'CREATE_DATABASE_ROWS' as const,
          databaseId: 'database-1',
          rows: [
            {
              values: {
                'property-title': 'Task 1',
              },
            },
          ],
        },
      ],
    };

    planValidator.validate.mockReturnValue(plan);

    planExecutor.execute.mockResolvedValue({
      createdBlockIds: ['block-1'],
      createdRowIds: ['row-1'],
    });

    const appliedGeneration = {
      id: 'generation-1',
      status: AiGenerationStatus.APPLIED,
    };

    applyGenerationHandler.execute.mockResolvedValue(appliedGeneration);

    const result = await handler.execute(
      new ConfirmAiModificationPlanCommand(
        'user-1',
        'generation-1',
        'share-token',
      ),
    );

    expect(unitOfWork.runInTransaction).toHaveBeenCalledTimes(1);

    expect(generationRepository.findByIdAndUserId).toHaveBeenCalledWith(
      'generation-1',
      'user-1',
      context,
    );

    expect(getAiPageContextHandler.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        pageId: 'page-1',
        shareToken: 'share-token',
      }),
    );

    expect(planValidator.validate).toHaveBeenCalledWith(
      generation.getOutputData(),
      pageContext,
    );

    expect(authorizationService.authorize).toHaveBeenNthCalledWith(1, {
      userId: 'user-1',
      permissions: [PERMISSIONS.PAGE_BLOCK_CREATE],
      target: {
        type: 'page',
        id: 'page-1',
      },
      shareToken: 'share-token',
    });

    expect(authorizationService.authorize).toHaveBeenNthCalledWith(2, {
      userId: 'user-1',
      permissions: [PERMISSIONS.DATABASE_UPDATE],
      target: {
        type: 'page',
        id: 'page-1',
      },
      shareToken: 'share-token',
    });

    expect(planExecutor.execute).toHaveBeenCalledWith({
      userId: 'user-1',
      plan,
    });

    expect(applyGenerationHandler.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        generationId: 'generation-1',
      }),
      context,
    );

    expect(result).toEqual({
      generation: appliedGeneration,
      execution: {
        createdBlockIds: ['block-1'],
        createdRowIds: ['row-1'],
      },
    });
  });

  it('rejects a plan that still needs more context', async () => {
    planValidator.validate.mockReturnValue({
      schemaVersion: 1,
      type: 'AI_MODIFICATION_PLAN',
      pageId: 'page-1',
      status: 'NEED_MORE_CONTEXT',
      summary: 'More context is required',
      operations: [],
      contextRequests: [
        {
          reason: 'MISSING_RESOURCE_CONTEXT',
          description: 'Database context is missing',
        },
      ],
    });

    await expect(
      handler.execute(
        new ConfirmAiModificationPlanCommand('user-1', 'generation-1'),
      ),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(authorizationService.authorize).not.toHaveBeenCalled();
    expect(planExecutor.execute).not.toHaveBeenCalled();
    expect(applyGenerationHandler.execute).not.toHaveBeenCalled();
  });

  it('rejects when block creation permission is denied', async () => {
    planValidator.validate.mockReturnValue({
      schemaVersion: 1,
      type: 'AI_MODIFICATION_PLAN',
      pageId: 'page-1',
      status: 'PLAN_READY',
      summary: 'Insert a block',
      operations: [
        {
          type: 'INSERT_BLOCKS',
          parentBlockId: null,
          afterBlockId: null,
          blocks: [
            {
              type: PageBlockType.TEXT,
              content: {
                text: 'Blocked',
              },
            },
          ],
        },
      ],
    });

    authorizationService.authorize.mockResolvedValue(false);

    await expect(
      handler.execute(
        new ConfirmAiModificationPlanCommand(
          'user-1',
          'generation-1',
          'share-token',
        ),
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(authorizationService.authorize).toHaveBeenCalledWith({
      userId: 'user-1',
      permissions: [PERMISSIONS.PAGE_BLOCK_CREATE],
      target: {
        type: 'page',
        id: 'page-1',
      },
      shareToken: 'share-token',
    });

    expect(planExecutor.execute).not.toHaveBeenCalled();
    expect(applyGenerationHandler.execute).not.toHaveBeenCalled();
  });

  it('rejects when database update permission is denied', async () => {
    planValidator.validate.mockReturnValue({
      schemaVersion: 1,
      type: 'AI_MODIFICATION_PLAN',
      pageId: 'page-1',
      status: 'PLAN_READY',
      summary: 'Create a database row',
      operations: [
        {
          type: 'CREATE_DATABASE_ROWS',
          databaseId: 'database-1',
          rows: [
            {
              values: {
                'property-title': 'Task 1',
              },
            },
          ],
        },
      ],
    });

    authorizationService.authorize.mockResolvedValue(false);

    await expect(
      handler.execute(
        new ConfirmAiModificationPlanCommand('user-1', 'generation-1'),
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(authorizationService.authorize).toHaveBeenCalledWith({
      userId: 'user-1',
      permissions: [PERMISSIONS.DATABASE_UPDATE],
      target: {
        type: 'page',
        id: 'page-1',
      },
      shareToken: undefined,
    });

    expect(planExecutor.execute).not.toHaveBeenCalled();
    expect(applyGenerationHandler.execute).not.toHaveBeenCalled();
  });

  it('does not apply the generation when executor fails', async () => {
    const plan = {
      schemaVersion: 1 as const,
      type: 'AI_MODIFICATION_PLAN' as const,
      pageId: 'page-1',
      status: 'PLAN_READY' as const,
      summary: 'Insert a block',
      operations: [
        {
          type: 'INSERT_BLOCKS' as const,
          parentBlockId: null,
          afterBlockId: null,
          blocks: [
            {
              type: PageBlockType.TEXT,
              content: {
                text: 'New block',
              },
            },
          ],
        },
      ],
    };

    planValidator.validate.mockReturnValue(plan);

    planExecutor.execute.mockRejectedValue(
      new Error('Modification execution failed'),
    );

    await expect(
      handler.execute(
        new ConfirmAiModificationPlanCommand('user-1', 'generation-1'),
      ),
    ).rejects.toThrow('Modification execution failed');

    expect(planExecutor.execute).toHaveBeenCalledWith({
      userId: 'user-1',
      plan,
    });

    expect(applyGenerationHandler.execute).not.toHaveBeenCalled();
  });

  it('rejects when generation workspace no longer matches page workspace', async () => {
    const differentContext = {
      ...pageContext,
      page: {
        ...pageContext.page,
        workspaceId: 'workspace-2',
      },
    };

    getAiPageContextHandler.execute.mockResolvedValue(differentContext);

    await expect(
      handler.execute(
        new ConfirmAiModificationPlanCommand('user-1', 'generation-1'),
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(planValidator.validate).not.toHaveBeenCalled();
    expect(authorizationService.authorize).not.toHaveBeenCalled();
    expect(planExecutor.execute).not.toHaveBeenCalled();
    expect(applyGenerationHandler.execute).not.toHaveBeenCalled();
  });
});
