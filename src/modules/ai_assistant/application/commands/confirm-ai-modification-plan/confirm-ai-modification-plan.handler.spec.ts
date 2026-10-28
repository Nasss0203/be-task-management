import { BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';

import { PageBlockType } from 'src/shared/domain/page-block-type.enum';

import { PERMISSIONS } from 'src/modules/permission/constants/permission.constant';
import type { AuthorizationService } from 'src/modules/permission/application/services/authorization.service';

import type { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';
import type { UnitOfWork } from 'src/shared/infrastructure/persistence/unit-of-work.interface';
import type { AiPageContextTransactionLocker } from '../../services/ai-page-context-transaction-lock.port';

import { AiGenerationStatus } from '../../../domain/enums/ai-generation-status.enum';
import type { AiGenerationRepository } from '../../../domain/repositories/ai-generation.repository';

import { AI_MODIFICATION_PLAN_CAPABILITY } from '../../constants/ai-modification-plan.constant';
import type { AiPageContextResponseDto } from '../../dto/response/ai-page-context.response.dto';

import type { GetAiPageContextHandler } from '../../queries/get-ai-page-context/get-ai-page-context.handler';

import type { AiModificationPlanExecutor } from '../../services/ai-modification-plan-executor.service';
import type { AiModificationPlanValidatorService } from '../../services/ai-modification-plan-validator.service';
import { fingerprintAiPageContext } from '../../services/ai-page-context-fingerprint';

import type { ApplyGenerationHandler } from '../apply-generation/apply-generation.handler';

import { ConfirmAiModificationPlanCommand } from './confirm-ai-modification-plan.command';
import { ConfirmAiModificationPlanHandler } from './confirm-ai-modification-plan.handler';

describe('ConfirmAiModificationPlanHandler', () => {
  const context = {
    transaction: 'test-context',
  } as unknown as PersistenceContext;

  const pageContext = {
    schemaVersion: 1,
    builtAt: '2026-10-19T08:00:00Z',
    page: {
      id: 'page-1',
      workspaceId: 'workspace-1',
      teamspaceId: null,
      parentPageId: null,
      title: 'Page 1',
      icon: null,
      coverUrl: null,
      updatedAt: '2026-10-19T07:00:00Z',
    },
    blocks: [],
    databaseReferences: [],
    databases: [],
    completeness: {
      blocks: { total: 0, included: 0, truncated: false },
      databases: { total: 0, included: 0, truncated: false },
      rows: [],
      textTruncated: false,
    },
  } as unknown as AiPageContextResponseDto;

  let generationRepository: {
    findByIdAndUserIdForUpdate: jest.Mock;
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
  let pageContextLock: { lock: jest.Mock };

  let handler: ConfirmAiModificationPlanHandler;

  const generation = {
    getCapability: jest.fn().mockReturnValue(AI_MODIFICATION_PLAN_CAPABILITY),
    getStatus: jest.fn().mockReturnValue(AiGenerationStatus.COMPLETED),
    getInputData: jest.fn().mockReturnValue({
      pageId: 'page-1',
      instruction: 'Add tasks',
      pageContextFingerprint: fingerprintAiPageContext(pageContext),
    }),
    getOutputData: jest.fn().mockReturnValue({
      stored: 'plan',
    }),
    getWorkspaceId: jest.fn().mockReturnValue('workspace-1'),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    generationRepository = {
      findByIdAndUserIdForUpdate: jest.fn().mockResolvedValue(generation),
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

    pageContextLock = { lock: jest.fn().mockResolvedValue(undefined) };
    handler = new ConfirmAiModificationPlanHandler(
      generationRepository as unknown as AiGenerationRepository,
      authorizationService as unknown as AuthorizationService,
      getAiPageContextHandler as unknown as GetAiPageContextHandler,
      planValidator as unknown as AiModificationPlanValidatorService,
      planExecutor as unknown as AiModificationPlanExecutor,
      applyGenerationHandler as unknown as ApplyGenerationHandler,
      unitOfWork as unknown as UnitOfWork,
      pageContextLock as unknown as AiPageContextTransactionLocker,
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

    expect(generationRepository.findByIdAndUserIdForUpdate).toHaveBeenCalledWith(
      'generation-1',
      'user-1',
      context,
    );
    expect(pageContextLock.lock).toHaveBeenCalledWith('page-1', context, 'user-1');
    expect(pageContextLock.lock.mock.invocationCallOrder[0]).toBeLessThan(
      getAiPageContextHandler.execute.mock.invocationCallOrder[0],
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

  it('rejects a legacy draft missing a Page fingerprint before execution', async () => {
    generation.getInputData.mockReturnValueOnce({ pageId: 'page-1' });
    planValidator.validate.mockReturnValue({
      status: 'PLAN_READY',
      pageId: 'page-1',
      operations: [{ type: 'INSERT_BLOCKS' }],
    });

    await expect(
      handler.execute(new ConfirmAiModificationPlanCommand('user-1', 'generation-1')),
    ).rejects.toMatchObject({
      status: 409,
      response: { code: 'AI_MODIFICATION_PLAN_STALE' },
    });

    expect(authorizationService.authorize).not.toHaveBeenCalled();
    expect(planExecutor.execute).not.toHaveBeenCalled();
    expect(applyGenerationHandler.execute).not.toHaveBeenCalled();
  });

  it('rejects a modified Page even when existing block IDs still validate', async () => {
    planValidator.validate.mockReturnValue({
      status: 'PLAN_READY',
      pageId: 'page-1',
      operations: [{ type: 'INSERT_BLOCKS' }],
    });
    const changedPageContext = {
      ...pageContext,
      page: { ...pageContext.page, title: 'Renamed after planning' },
    };
    getAiPageContextHandler.execute.mockResolvedValue(changedPageContext);

    await expect(
      handler.execute(new ConfirmAiModificationPlanCommand('user-1', 'generation-1')),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(planValidator.validate).not.toHaveBeenCalled();
    expect(authorizationService.authorize).not.toHaveBeenCalled();
    expect(planExecutor.execute).not.toHaveBeenCalled();
    expect(applyGenerationHandler.execute).not.toHaveBeenCalled();
  });

  it('returns 409 before plan validation when a referenced block was deleted', async () => {
    const original = {
      ...pageContext,
      blocks: [
        {
          id: 'block-to-delete',
          parentBlockId: null,
          type: PageBlockType.TEXT,
          orderIndex: 0,
          title: null,
          content: { text: 'Original' },
          styleConfig: null,
          dataConfig: null,
        },
      ],
      completeness: {
        ...pageContext.completeness,
        blocks: { total: 1, included: 1, truncated: false },
      },
    } satisfies AiPageContextResponseDto;
    generation.getInputData.mockReturnValueOnce({
      pageId: 'page-1',
      pageContextFingerprint: fingerprintAiPageContext(original),
    });
    // The fresh context has no blocks, so operation anchors are now invalid.

    await expect(
      handler.execute(new ConfirmAiModificationPlanCommand('user-1', 'generation-1')),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(planValidator.validate).not.toHaveBeenCalled();
    expect(planExecutor.execute).not.toHaveBeenCalled();
    expect(applyGenerationHandler.execute).not.toHaveBeenCalled();
  });

  it('rejects a truncated current Page context before any write', async () => {
    planValidator.validate.mockReturnValue({
      status: 'PLAN_READY',
      pageId: 'page-1',
      operations: [{ type: 'INSERT_BLOCKS' }],
    });
    getAiPageContextHandler.execute.mockResolvedValue({
      ...pageContext,
      completeness: { ...pageContext.completeness, textTruncated: true },
    });

    await expect(
      handler.execute(new ConfirmAiModificationPlanCommand('user-1', 'generation-1')),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(planExecutor.execute).not.toHaveBeenCalled();
    expect(applyGenerationHandler.execute).not.toHaveBeenCalled();
  });

  it.each([AiGenerationStatus.APPLIED, AiGenerationStatus.DISCARDED])(
    'rejects %s after acquiring the generation lock without executing operations',
    async (status) => {
      generation.getStatus.mockReturnValueOnce(status);

      await expect(
        handler.execute(new ConfirmAiModificationPlanCommand('user-1', 'generation-1')),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(generationRepository.findByIdAndUserIdForUpdate).toHaveBeenCalledWith(
        'generation-1', 'user-1', context,
      );
      expect(getAiPageContextHandler.execute).not.toHaveBeenCalled();
      expect(pageContextLock.lock).not.toHaveBeenCalled();
      expect(planExecutor.execute).not.toHaveBeenCalled();
      expect(applyGenerationHandler.execute).not.toHaveBeenCalled();
    },
  );

  it('does not read or execute a plan when acquiring the Page context lock fails', async () => {
    pageContextLock.lock.mockRejectedValueOnce(new Error('database lock failure'));

    await expect(
      handler.execute(new ConfirmAiModificationPlanCommand('user-1', 'generation-1')),
    ).rejects.toThrow('database lock failure');

    expect(getAiPageContextHandler.execute).not.toHaveBeenCalled();
    expect(planValidator.validate).not.toHaveBeenCalled();
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

  describe('SET_TODO_CHECKED (kế hoạch tích to-do)', () => {
    const tickPlan = {
      schemaVersion: 1,
      type: 'AI_MODIFICATION_PLAN',
      pageId: 'page-1',
      status: 'PLAN_READY',
      summary: 'Tích 1 to-do: Gửi email',
      operations: [
        {
          type: 'SET_TODO_CHECKED',
          blockId: 'todo-1',
          text: 'Gửi email',
          checked: true,
        },
      ],
    };
    const blockUpdate = (shareToken?: string) => ({
      userId: 'user-1',
      permissions: [PERMISSIONS.PAGE_BLOCK_UPDATE],
      target: { type: 'page', id: 'page-1' },
      shareToken,
    });

    it('requires block update permission, not block creation', async () => {
      planValidator.validate.mockReturnValue(tickPlan);
      await handler.execute(
        new ConfirmAiModificationPlanCommand('user-1', 'generation-1'),
      );
      expect(authorizationService.authorize).toHaveBeenCalledTimes(1);
      expect(authorizationService.authorize).toHaveBeenCalledWith(
        blockUpdate(),
      );
      expect(planExecutor.execute).toHaveBeenCalled();
    });

    it('rejects when block update permission is denied', async () => {
      planValidator.validate.mockReturnValue(tickPlan);
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
      expect(authorizationService.authorize).toHaveBeenCalledWith(
        blockUpdate('share-token'),
      );
      expect(planExecutor.execute).not.toHaveBeenCalled();
      expect(applyGenerationHandler.execute).not.toHaveBeenCalled();
    });
  });

  it('requires block update permission for a text edit (kế hoạch sửa chữ block)', async () => {
    planValidator.validate.mockReturnValue({
      schemaVersion: 1,
      type: 'AI_MODIFICATION_PLAN',
      pageId: 'page-1',
      status: 'PLAN_READY',
      summary: 'Sửa 1 block',
      operations: [
        {
          type: 'SET_BLOCK_TEXT',
          blockId: 'block-1',
          oldText: 'A',
          newText: 'B',
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
      permissions: [PERMISSIONS.PAGE_BLOCK_UPDATE],
      target: { type: 'page', id: 'page-1' },
      shareToken: undefined,
    });
    expect(planExecutor.execute).not.toHaveBeenCalled();
  });

  it('requires block delete permission for a delete (kế hoạch xoá block)', async () => {
    planValidator.validate.mockReturnValue({
      schemaVersion: 1,
      type: 'AI_MODIFICATION_PLAN',
      pageId: 'page-1',
      status: 'PLAN_READY',
      summary: 'Xoá 1 block',
      operations: [
        { type: 'DELETE_BLOCK', blockId: 'block-1', text: 'A', childCount: 0 },
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
      permissions: [PERMISSIONS.PAGE_BLOCK_DELETE],
      target: { type: 'page', id: 'page-1' },
      shareToken: undefined,
    });
    expect(planExecutor.execute).not.toHaveBeenCalled();
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
