import type { AuthorizationService } from 'src/modules/permission/application/services/authorization.service';

import { AiGeneration } from '../../../domain/aggregates/ai-generation/ai-generation.aggregate';
import { AiGenerationStatus } from '../../../domain/enums/ai-generation-status.enum';
import type { AiGenerationRepository } from '../../../domain/repositories/ai-generation.repository';

import { AI_MODIFICATION_PLAN_CAPABILITY } from '../../constants/ai-modification-plan.constant';
import { PAGE_COMPOSITION_CAPABILITY } from '../../constants/page-composition.constant';

import type { GetAiPageContextHandler } from '../get-ai-page-context/get-ai-page-context.handler';
import { GetAiPageContextQuery } from '../get-ai-page-context/get-ai-page-context.query';

import type { AiModificationPlanValidatorService } from '../../services/ai-modification-plan-validator.service';
import { PAGE_COMPOSITION_SCHEMA_VERSION } from '../../types/page-composition-draft';

import { GetGenerationHandler } from './get-generation.handler';
import { GetGenerationQuery } from './get-generation.query';

describe('GetGenerationHandler', () => {
  it('returns page composition output with preview', async () => {
    const draft = {
      schemaVersion: PAGE_COMPOSITION_SCHEMA_VERSION,
      type: 'PAGE_COMPOSITION' as const,
      page: {
        title: 'Sprint Planning',
      },
      blocks: [],
      databases: [],
    };

    const generation = AiGeneration.create({
      id: 'generation-1',
      conversationId: 'conversation-1',
      userId: 'user-1',
      workspaceId: null,
      capability: PAGE_COMPOSITION_CAPABILITY,
      inputData: {
        message: 'Create a sprint planning page',
      },
    });

    generation.complete({
      outputData: draft,
      provider: 'ollama',
      model: 'qwen3:4b-instruct',
    });

    const findByIdAndUserId = jest.fn().mockResolvedValue(generation);
    const authorize = jest.fn().mockResolvedValue(true);
    const getAiPageContextExecute = jest.fn();
    const validate = jest.fn();

    const handler = new GetGenerationHandler(
      {
        findByIdAndUserId,
      } as unknown as AiGenerationRepository,
      {
        authorize,
      } as unknown as AuthorizationService,
      {
        execute: getAiPageContextExecute,
      } as unknown as GetAiPageContextHandler,
      {
        validate,
      } as unknown as AiModificationPlanValidatorService,
    );

    const result = await handler.execute(
      new GetGenerationQuery('user-1', 'generation-1'),
    );

    expect(findByIdAndUserId).toHaveBeenCalledWith('generation-1', 'user-1');

    expect(authorize).not.toHaveBeenCalled();
    expect(getAiPageContextExecute).not.toHaveBeenCalled();
    expect(validate).not.toHaveBeenCalled();

    expect(result.status).toBe(AiGenerationStatus.COMPLETED);

    expect(result.output_data).toEqual(draft);

    expect(result.preview).toEqual({
      type: 'PAGE_COMPOSITION',
      page: {
        title: 'Sprint Planning',
        icon: null,
        cover_url: null,
      },
      summary: {
        blocks: 0,
        databases: 0,
        database_rows: 0,
      },
    });
  });

  it('revalidates page modification plan with fresh page context and share token', async () => {
    const plan = {
      schemaVersion: 1,
      type: 'AI_MODIFICATION_PLAN',
      pageId: 'page-1',
      status: 'PLAN_READY',
      summary: 'Add a task block',
      operations: [
        {
          type: 'INSERT_BLOCKS',
          parentBlockId: null,
          afterBlockId: null,
          blocks: [
            {
              type: 'TEXT',
              content: {
                text: 'New task',
              },
            },
          ],
        },
      ],
    };

    const generation = AiGeneration.create({
      id: 'generation-1',
      conversationId: null,
      userId: 'user-1',
      workspaceId: 'workspace-1',
      capability: AI_MODIFICATION_PLAN_CAPABILITY,
      inputData: {
        pageId: 'page-1',
        instruction: 'Add a task block',
        requestId: 'request-1',
      },
    });

    generation.complete({
      outputData: plan,
      provider: 'ollama',
      model: 'qwen3:4b-instruct',
    });

    const context = {
      schemaVersion: 1,
      builtAt: '2026-10-08T00:00:00.000Z',
      page: {
        id: 'page-1',
        workspaceId: 'workspace-1',
        teamspaceId: null,
        parentPageId: null,
        title: 'Tasks',
        icon: null,
        coverUrl: null,
        updatedAt: '2026-10-08T00:00:00.000Z',
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

    const findByIdAndUserId = jest.fn().mockResolvedValue(generation);
    const authorize = jest.fn().mockResolvedValue(true);
    const getAiPageContextExecute = jest.fn().mockResolvedValue(context);
    const validate = jest.fn().mockReturnValue(plan);

    const handler = new GetGenerationHandler(
      {
        findByIdAndUserId,
      } as unknown as AiGenerationRepository,
      {
        authorize,
      } as unknown as AuthorizationService,
      {
        execute: getAiPageContextExecute,
      } as unknown as GetAiPageContextHandler,
      {
        validate,
      } as unknown as AiModificationPlanValidatorService,
    );

    const result = await handler.execute(
      new GetGenerationQuery('user-1', 'generation-1', 'share-token-1'),
    );

    expect(findByIdAndUserId).toHaveBeenCalledWith('generation-1', 'user-1');

    expect(getAiPageContextExecute).toHaveBeenCalledWith(
      new GetAiPageContextQuery('user-1', 'page-1', 'share-token-1'),
    );

    expect(validate).toHaveBeenCalledWith(plan, context);

    expect(authorize).not.toHaveBeenCalled();

    expect(result.status).toBe(AiGenerationStatus.COMPLETED);
    expect(result.capability).toBe(AI_MODIFICATION_PLAN_CAPABILITY);
    expect(result.output_data).toEqual(plan);
    expect(result.preview).toEqual({
      type: 'AI_MODIFICATION_PLAN',
      pageId: 'page-1',
      status: 'PLAN_READY',
      summary: 'Add a task block',
      counts: {
        operations: 1,
        blocks: 1,
        databaseRows: 0,
      },
      operations: plan.operations,
    });
  });
  it('rejects page modification generation with invalid stored input data', async () => {
    const generation = AiGeneration.create({
      id: 'generation-1',
      conversationId: null,
      userId: 'user-1',
      workspaceId: 'workspace-1',
      capability: AI_MODIFICATION_PLAN_CAPABILITY,
    });

    generation.complete({
      outputData: {
        schemaVersion: 1,
        type: 'AI_MODIFICATION_PLAN',
        pageId: 'page-1',
        status: 'PLAN_READY',
        summary: 'Add content',
        operations: [],
      },
      provider: 'ollama',
      model: 'qwen3:4b-instruct',
    });

    const findByIdAndUserId = jest.fn().mockResolvedValue(generation);
    const authorize = jest.fn();
    const getAiPageContextExecute = jest.fn();
    const validate = jest.fn();

    const handler = new GetGenerationHandler(
      {
        findByIdAndUserId,
      } as unknown as AiGenerationRepository,
      {
        authorize,
      } as unknown as AuthorizationService,
      {
        execute: getAiPageContextExecute,
      } as unknown as GetAiPageContextHandler,
      {
        validate,
      } as unknown as AiModificationPlanValidatorService,
    );

    await expect(
      handler.execute(new GetGenerationQuery('user-1', 'generation-1')),
    ).rejects.toThrow('AI modification plan generation has invalid input data');

    expect(getAiPageContextExecute).not.toHaveBeenCalled();
    expect(validate).not.toHaveBeenCalled();
    expect(authorize).not.toHaveBeenCalled();
  });

  it('rejects page modification generation without stored pageId', async () => {
    const generation = AiGeneration.create({
      id: 'generation-1',
      conversationId: null,
      userId: 'user-1',
      workspaceId: 'workspace-1',
      capability: AI_MODIFICATION_PLAN_CAPABILITY,
      inputData: {
        instruction: 'Add content',
        requestId: 'request-1',
      },
    });

    generation.complete({
      outputData: {
        schemaVersion: 1,
        type: 'AI_MODIFICATION_PLAN',
        pageId: 'page-1',
        status: 'PLAN_READY',
        summary: 'Add content',
        operations: [],
      },
      provider: 'ollama',
      model: 'qwen3:4b-instruct',
    });

    const findByIdAndUserId = jest.fn().mockResolvedValue(generation);
    const authorize = jest.fn();
    const getAiPageContextExecute = jest.fn();
    const validate = jest.fn();

    const handler = new GetGenerationHandler(
      {
        findByIdAndUserId,
      } as unknown as AiGenerationRepository,
      {
        authorize,
      } as unknown as AuthorizationService,
      {
        execute: getAiPageContextExecute,
      } as unknown as GetAiPageContextHandler,
      {
        validate,
      } as unknown as AiModificationPlanValidatorService,
    );

    await expect(
      handler.execute(new GetGenerationQuery('user-1', 'generation-1')),
    ).rejects.toThrow('AI modification plan generation is missing pageId');

    expect(getAiPageContextExecute).not.toHaveBeenCalled();
    expect(validate).not.toHaveBeenCalled();
    expect(authorize).not.toHaveBeenCalled();
  });

  it('rejects page modification generation when workspace scope no longer matches the page', async () => {
    const generation = AiGeneration.create({
      id: 'generation-1',
      conversationId: null,
      userId: 'user-1',
      workspaceId: 'workspace-1',
      capability: AI_MODIFICATION_PLAN_CAPABILITY,
      inputData: {
        pageId: 'page-1',
        instruction: 'Add content',
        requestId: 'request-1',
      },
    });

    generation.complete({
      outputData: {
        schemaVersion: 1,
        type: 'AI_MODIFICATION_PLAN',
        pageId: 'page-1',
        status: 'PLAN_READY',
        summary: 'Add content',
        operations: [],
      },
      provider: 'ollama',
      model: 'qwen3:4b-instruct',
    });

    const context = {
      schemaVersion: 1,
      builtAt: '2026-10-08T00:00:00.000Z',
      page: {
        id: 'page-1',
        workspaceId: 'workspace-2',
        teamspaceId: null,
        parentPageId: null,
        title: 'Tasks',
        icon: null,
        coverUrl: null,
        updatedAt: '2026-10-08T00:00:00.000Z',
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

    const findByIdAndUserId = jest.fn().mockResolvedValue(generation);
    const authorize = jest.fn();
    const getAiPageContextExecute = jest.fn().mockResolvedValue(context);
    const validate = jest.fn();

    const handler = new GetGenerationHandler(
      {
        findByIdAndUserId,
      } as unknown as AiGenerationRepository,
      {
        authorize,
      } as unknown as AuthorizationService,
      {
        execute: getAiPageContextExecute,
      } as unknown as GetAiPageContextHandler,
      {
        validate,
      } as unknown as AiModificationPlanValidatorService,
    );

    await expect(
      handler.execute(
        new GetGenerationQuery('user-1', 'generation-1', 'share-token-1'),
      ),
    ).rejects.toThrow(
      'AI generation workspace scope does not match target page',
    );

    expect(getAiPageContextExecute).toHaveBeenCalledWith(
      new GetAiPageContextQuery('user-1', 'page-1', 'share-token-1'),
    );

    expect(validate).not.toHaveBeenCalled();
    expect(authorize).not.toHaveBeenCalled();
  });
});
