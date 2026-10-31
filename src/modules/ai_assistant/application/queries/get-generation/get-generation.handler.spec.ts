import {
  BadGatewayException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import type { PageRepository } from 'src/modules/content/domain/repositories/page.repository';
import { AiConversation } from '../../../domain/aggregates/ai-conversation/ai-conversation.aggregate';
import { AiConversationStatus } from '../../../domain/enums/ai-conversation-status.enum';
import { GetConversationHandler } from '../get-conversation/get-conversation.handler';
import { GetConversationQuery } from '../get-conversation/get-conversation.query';
import { ListConversationMessagesHandler } from '../list-conversation-messages/list-conversation-messages.handler';
import { ListConversationMessagesQuery } from '../list-conversation-messages/list-conversation-messages.query';
import { ListConversationGenerationsHandler } from '../list-conversation-generations/list-conversation-generations.handler';
import { ListConversationGenerationsQuery } from '../list-conversation-generations/list-conversation-generations.query';
import { AiConversationScope } from '../../../domain/enums/ai-conversation-scope.enum';
import type { AiConversationRepository } from '../../../domain/repositories/ai-conversation.repository';
import { AiConversationAccessService } from '../../services/ai-conversation-access.service';
import type { AuthorizationService } from 'src/modules/permission/application/services/authorization.service';

import { AiGeneration } from '../../../domain/aggregates/ai-generation/ai-generation.aggregate';
import { AiGenerationStatus } from '../../../domain/enums/ai-generation-status.enum';
import type { AiGenerationRepository } from '../../../domain/repositories/ai-generation.repository';
import type { AiMessageRepository } from '../../../domain/repositories/ai-message.repository';

import { AI_MODIFICATION_PLAN_CAPABILITY } from '../../constants/ai-modification-plan.constant';
import { PAGE_COMPOSITION_CAPABILITY } from '../../constants/page-composition.constant';

import type { GetAiPageContextHandler } from '../get-ai-page-context/get-ai-page-context.handler';
import { GetAiPageContextQuery } from '../get-ai-page-context/get-ai-page-context.query';

import type { AiModificationPlanValidatorService } from '../../services/ai-modification-plan-validator.service';
import { PAGE_COMPOSITION_SCHEMA_VERSION } from '../../types/page-composition-draft';

import { GetGenerationHandler } from './get-generation.handler';
import { GetGenerationQuery } from './get-generation.query';

describe('GetGenerationHandler', () => {
  it('reads a FAILED modification generation without validating null output', async () => {
    const generation = AiGeneration.create({
      userId: 'user-1',
      workspaceId: 'workspace-1',
      capability: AI_MODIFICATION_PLAN_CAPABILITY,
      inputData: { pageId: 'page-1' },
    });
    generation.fail('AI_MODIFICATION_PLAN_ERROR', 'Runtime unavailable');
    const context = { page: { id: 'page-1', workspaceId: 'workspace-1' } };
    const validate = jest.fn();
    const handler = new GetGenerationHandler(
      {
        findByIdAndUserId: jest.fn().mockResolvedValue(generation),
      } as unknown as AiGenerationRepository,
      { authorize: jest.fn() } as unknown as AuthorizationService,
      {
        execute: jest.fn().mockResolvedValue(context),
      } as unknown as GetAiPageContextHandler,
      { validate } as unknown as AiModificationPlanValidatorService,
      {} as AiConversationRepository,
      {} as AiConversationAccessService,
    );
    const result = await handler.execute(
      new GetGenerationQuery('user-1', generation.getId()),
    );
    expect(result.status).toBe(AiGenerationStatus.FAILED);
    expect(result.error_message).toBe('Runtime unavailable');
    expect(validate).not.toHaveBeenCalled();
  });

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
      conversationId: null,
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
      {} as AiConversationRepository,
      {} as AiConversationAccessService,
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
      {} as AiConversationRepository,
      {} as AiConversationAccessService,
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
        todoUpdates: 0,
        blockEdits: 0,
        blockDeletes: 0,
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
      {} as AiConversationRepository,
      {} as AiConversationAccessService,
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
      {} as AiConversationRepository,
      {} as AiConversationAccessService,
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
      {} as AiConversationRepository,
      {} as AiConversationAccessService,
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

describe('FIX03 conversation authorization (real access service)', () => {
  function setup(
    scope = AiConversationScope.PAGE,
    workspaceId: string | null = 'workspace-1',
  ) {
    const conversation =
      scope === AiConversationScope.LEGACY
        ? AiConversation.restore({
            id: 'conversation-1',
            userId: 'user-1',
            workspaceId,
            scope,
            pageId: null,
            title: null,
            status: AiConversationStatus.ACTIVE,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
        : AiConversation.create({
            id: 'conversation-1',
            userId: 'user-1',
            workspaceId,
            scope,
            pageId: scope === AiConversationScope.PAGE ? 'page-1' : null,
          });
    const generation = AiGeneration.create({
      userId: 'user-1',
      workspaceId,
      conversationId: conversation.getId(),
      capability: 'writing.translate',
      inputData: { text: 'private source' },
    });
    generation.complete({ outputData: 'private translation' });
    const authorize = jest
      .fn()
      .mockImplementation(
        (request: Parameters<AuthorizationService['authorize']>[0]) =>
          Promise.resolve(request.target.type === 'workspace'),
      );
    const page = {
      getId: () => 'page-1',
      getWorkspaceId: () => 'workspace-1',
      getDeletedAt: () => null,
    };
    const findPage = jest.fn().mockResolvedValue(page);
    const access = new AiConversationAccessService(
      { findById: findPage } as unknown as PageRepository,
      { authorize } as unknown as AuthorizationService,
    );
    const assertCanRead = jest.spyOn(access, 'assertCanRead');
    const conversations = {
      findByIdAndUserId: jest.fn().mockResolvedValue(conversation),
    };
    const generations = {
      findByIdAndUserId: jest.fn().mockResolvedValue(generation),
      save: jest.fn(),
    };
    const context = { execute: jest.fn() };
    const validator = { validate: jest.fn() };
    const handler = new GetGenerationHandler(
      generations as unknown as AiGenerationRepository,
      { authorize } as unknown as AuthorizationService,
      context as unknown as GetAiPageContextHandler,
      validator as unknown as AiModificationPlanValidatorService,
      conversations as unknown as AiConversationRepository,
      access,
    );
    return {
      handler,
      generation,
      conversation,
      conversations,
      generations,
      authorize,
      findPage,
      page,
      access,
      assertCanRead,
      context,
      validator,
    };
  }

  it('F-01: denies private PAGE writing output when PAGE_READ is revoked despite WORKSPACE_READ', async () => {
    const f = setup();
    await expect(
      f.handler.execute(new GetGenerationQuery('user-1', f.generation.getId())),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(f.assertCanRead).toHaveBeenCalledWith(
      f.conversation,
      'user-1',
      undefined,
    );
    expect(f.context.execute).not.toHaveBeenCalled();
    expect(f.validator.validate).not.toHaveBeenCalled();
    expect(f.generations.save).not.toHaveBeenCalled();
  });
  it('allows PAGE writing with PAGE_READ and forwards the token', async () => {
    const f = setup();
    f.authorize.mockResolvedValue(true);
    const result = await f.handler.execute(
      new GetGenerationQuery('user-1', f.generation.getId(), 'token'),
    );
    expect(result.output_data).toBe('private translation');
    expect(f.authorize).toHaveBeenCalledWith(
      expect.objectContaining({
        target: { type: 'page', id: 'page-1' },
        shareToken: 'token',
      }),
    );
    expect(f.conversations.findByIdAndUserId).toHaveBeenCalledWith(
      'conversation-1',
      'user-1',
    );
  });

  it.each(['valid', 'invalid', 'expired', 'wrong-page'])(
    'delegates share-token policy: %s',
    async (token) => {
      const f = setup();
      f.authorize.mockImplementation(
        (request: Parameters<AuthorizationService['authorize']>[0]) =>
          Promise.resolve(
            request.target.type === 'page' && request.shareToken === 'valid',
          ),
      );
      const result = f.handler.execute(
        new GetGenerationQuery('user-1', f.generation.getId(), token),
      );
      if (token === 'valid')
        expect((await result).output_data).toBe('private translation');
      else await expect(result).rejects.toBeInstanceOf(ForbiddenException);
    },
  );

  it.each([true, false])(
    'GLOBAL requires WORKSPACE_READ: %s',
    async (allowed) => {
      const f = setup(AiConversationScope.GLOBAL);
      f.authorize.mockResolvedValue(allowed);
      const result = f.handler.execute(
        new GetGenerationQuery('user-1', f.generation.getId()),
      );
      if (allowed)
        expect((await result).status).toBe(AiGenerationStatus.COMPLETED);
      else await expect(result).rejects.toBeInstanceOf(ForbiddenException);
      expect(f.findPage).not.toHaveBeenCalled();
    },
  );

  it.each([null, 'workspace-1'])(
    'preserves restored LEGACY scope with workspace %s',
    async (workspace) => {
      const f = setup(AiConversationScope.LEGACY, workspace);
      expect(
        (
          await f.handler.execute(
            new GetGenerationQuery('user-1', f.generation.getId()),
          )
        ).output_data,
      ).toBe('private translation');
    },
  );

  it.each(['missing', 'other-user', 'workspace', 'null-workspace'])(
    'fails closed for linked conversation: %s',
    async (kind) => {
      const f = setup();
      f.authorize.mockResolvedValue(true);
      const conversation =
        kind === 'missing'
          ? null
          : AiConversation.restore({
              id: 'conversation-1',
              userId: kind === 'other-user' ? 'user-2' : 'user-1',
              workspaceId:
                kind === 'workspace'
                  ? 'workspace-2'
                  : kind === 'null-workspace'
                    ? null
                    : 'workspace-1',
              scope: AiConversationScope.PAGE,
              pageId: 'page-1',
              title: null,
              status: AiConversationStatus.ACTIVE,
              createdAt: new Date(),
              updatedAt: new Date(),
            });
      f.conversations.findByIdAndUserId.mockResolvedValue(conversation);
      await expect(
        f.handler.execute(
          new GetGenerationQuery('user-1', f.generation.getId()),
        ),
      ).rejects.toThrow();
      expect(f.authorize).not.toHaveBeenCalled();
    },
  );

  it.each(['missing', 'deleted', 'other-workspace'])(
    'rejects Page %s',
    async (kind) => {
      const f = setup();
      f.authorize.mockResolvedValue(true);
      f.findPage.mockResolvedValue(
        kind === 'missing'
          ? null
          : {
              ...f.page,
              getDeletedAt: () => (kind === 'deleted' ? new Date() : null),
              getWorkspaceId: () =>
                kind === 'other-workspace' ? 'workspace-2' : 'workspace-1',
            },
      );
      await expect(
        f.handler.execute(
          new GetGenerationQuery('user-1', f.generation.getId()),
        ),
      ).rejects.toThrow();
    },
  );

  it('rejects a generation not owned by the actor before conversation access', async () => {
    const f = setup();
    f.authorize.mockResolvedValue(true);
    f.generations.findByIdAndUserId.mockResolvedValue(null);
    await expect(
      f.handler.execute(new GetGenerationQuery('user-2', f.generation.getId())),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(f.conversations.findByIdAndUserId).not.toHaveBeenCalled();
  });

  it.each([AiGenerationStatus.PROCESSING, AiGenerationStatus.FAILED])(
    'authorizes status %s before returning input/errors',
    async (status) => {
      const f = setup();
      f.generations.findByIdAndUserId.mockResolvedValue(
        AiGeneration.create({
          userId: 'user-1',
          workspaceId: 'workspace-1',
          conversationId: 'conversation-1',
          capability: 'writing.improve',
          status,
          inputData: 'private input',
          errorMessage: 'private error',
        }),
      );
      await expect(
        f.handler.execute(
          new GetGenerationQuery('user-1', f.generation.getId()),
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
      f.authorize.mockResolvedValue(true);
      expect(
        (
          await f.handler.execute(
            new GetGenerationQuery('user-1', f.generation.getId()),
          )
        ).status,
      ).toBe(status);
    },
  );

  it('propagates authorization errors without fallback', async () => {
    const f = setup();
    const error = new Error('permission unavailable');
    f.authorize.mockRejectedValue(error);
    await expect(
      f.handler.execute(new GetGenerationQuery('user-1', f.generation.getId())),
    ).rejects.toBe(error);
    expect(f.authorize).toHaveBeenCalledTimes(1);
  });

  it.each([
    'writing.improve',
    'writing.summarize',
    PAGE_COMPOSITION_CAPABILITY,
    AI_MODIFICATION_PLAN_CAPABILITY,
  ])('guards all linked capabilities: %s', async (capability) => {
    const f = setup();
    f.generations.findByIdAndUserId.mockResolvedValue(
      AiGeneration.create({
        userId: 'user-1',
        workspaceId: 'workspace-1',
        conversationId: 'conversation-1',
        capability,
      }),
    );
    await expect(
      f.handler.execute(new GetGenerationQuery('user-1', f.generation.getId())),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(f.context.execute).not.toHaveBeenCalled();
  });

  it('keeps Page Context authorization and plan validation after conversation authorization', async () => {
    const f = setup();
    f.authorize.mockResolvedValue(true);
    const generation = AiGeneration.create({
      userId: 'user-1',
      workspaceId: 'workspace-1',
      conversationId: 'conversation-1',
      capability: AI_MODIFICATION_PLAN_CAPABILITY,
      inputData: { pageId: 'page-1' },
    });
    generation.complete({ outputData: { private: 'plan' } });
    f.generations.findByIdAndUserId.mockResolvedValue(generation);
    const context = { page: { id: 'page-1', workspaceId: 'workspace-1' } };
    f.context.execute.mockResolvedValue(context);
    f.validator.validate.mockReturnValue({
      operations: [],
      pageId: 'page-1',
      status: 'PLAN_READY',
      summary: 'Plan',
    });
    await f.handler.execute(
      new GetGenerationQuery('user-1', generation.getId(), 'token'),
    );
    expect(f.context.execute).toHaveBeenCalledWith(
      new GetAiPageContextQuery('user-1', 'page-1', 'token'),
    );
    expect(f.validator.validate).toHaveBeenCalledWith(
      generation.getOutputData(),
      context,
    );
    f.context.execute.mockRejectedValue(new ForbiddenException());
    await expect(
      f.handler.execute(new GetGenerationQuery('user-1', generation.getId())),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('preserves stale modification history after both authorization checks', async () => {
    const f = setup();
    f.authorize.mockResolvedValue(true);
    const generation = AiGeneration.create({
      userId: 'user-1',
      workspaceId: 'workspace-1',
      conversationId: 'conversation-1',
      capability: AI_MODIFICATION_PLAN_CAPABILITY,
      inputData: { pageId: 'page-1' },
    });
    generation.complete({ outputData: { private: 'stale plan' } });
    f.generations.findByIdAndUserId.mockResolvedValue(generation);
    f.context.execute.mockResolvedValue({
      page: { workspaceId: 'workspace-1' },
    });
    f.validator.validate.mockImplementation(() => {
      throw new BadGatewayException();
    });
    expect(
      (
        await f.handler.execute(
          new GetGenerationQuery('user-1', generation.getId()),
        )
      ).output_data,
    ).toEqual({ private: 'stale plan' });
    expect(f.assertCanRead).toHaveBeenCalled();
  });

  it('consistently rejects all four history handlers after PAGE_READ revocation', async () => {
    const f = setup();
    const repository = f.conversations as unknown as AiConversationRepository;
    const messages = {
      save: jest.fn(),
      findFirstUserContentsByConversationIds: jest.fn(),
      findByConversationId: jest.fn(),
    } satisfies jest.Mocked<AiMessageRepository>;
    const generations = {
      save: jest.fn(),
      findById: jest.fn(),
      findByIdAndUserId: jest.fn(),
      findByIdAndUserIdForUpdate: jest.fn(),
      findByConversationId: jest.fn(),
      findPageByConversationId: jest.fn(),
    } satisfies jest.Mocked<AiGenerationRepository>;
    const calls = [
      () =>
        new GetConversationHandler(repository, f.access).execute(
          new GetConversationQuery('user-1', 'conversation-1'),
        ),
      () =>
        new ListConversationMessagesHandler(
          repository,
          messages,
          f.access,
        ).execute(
          new ListConversationMessagesQuery('user-1', 'conversation-1'),
        ),
      () =>
        new ListConversationGenerationsHandler(
          repository,
          generations,
          f.access,
        ).execute(
          new ListConversationGenerationsQuery('user-1', 'conversation-1'),
        ),
      () =>
        f.handler.execute(
          new GetGenerationQuery('user-1', f.generation.getId()),
        ),
    ];
    for (const call of calls)
      await expect(call()).rejects.toBeInstanceOf(ForbiddenException);
    expect(messages.findByConversationId).not.toHaveBeenCalled();
    expect(generations.findPageByConversationId).not.toHaveBeenCalled();
  });
  it.each([null, 'workspace-1'])(
    'preserves unlinked writing with workspace %s',
    async (workspaceId) => {
      const f = setup();
      const generation = AiGeneration.create({
        userId: 'user-1',
        workspaceId,
        capability: 'writing.translate',
      });
      generation.complete({ outputData: 'legacy output' });
      f.generations.findByIdAndUserId.mockResolvedValue(generation);
      expect(
        (
          await f.handler.execute(
            new GetGenerationQuery('user-1', generation.getId()),
          )
        ).output_data,
      ).toBe('legacy output');
      expect(f.conversations.findByIdAndUserId).not.toHaveBeenCalled();
      if (workspaceId) {
        f.authorize.mockResolvedValue(false);
        await expect(
          f.handler.execute(
            new GetGenerationQuery('user-1', generation.getId()),
          ),
        ).rejects.toBeInstanceOf(ForbiddenException);
      } else expect(f.authorize).not.toHaveBeenCalled();
    },
  );

  it('returns GLOBAL composition preview after conversation authorization', async () => {
    const f = setup(AiConversationScope.GLOBAL);
    const generation = AiGeneration.create({
      userId: 'user-1',
      workspaceId: 'workspace-1',
      conversationId: 'conversation-1',
      capability: PAGE_COMPOSITION_CAPABILITY,
    });
    generation.complete({
      outputData: {
        schemaVersion: PAGE_COMPOSITION_SCHEMA_VERSION,
        type: 'PAGE_COMPOSITION',
        page: { title: 'Draft' },
        blocks: [],
        databases: [],
      },
    });
    f.generations.findByIdAndUserId.mockResolvedValue(generation);
    const result = await f.handler.execute(
      new GetGenerationQuery('user-1', generation.getId()),
    );
    expect(result.preview).toMatchObject({
      type: 'PAGE_COMPOSITION',
      page: { title: 'Draft' },
    });
    expect(f.assertCanRead).toHaveBeenCalled();
  });
});
