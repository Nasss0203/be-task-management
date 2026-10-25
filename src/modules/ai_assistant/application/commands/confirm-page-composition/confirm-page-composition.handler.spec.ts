import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';

import type { PageRepository } from 'src/modules/content/domain/repositories/page.repository';

import type { AuthorizationService } from 'src/modules/permission/application/services/authorization.service';
import type { AuthorizeParams } from 'src/modules/permission/application/services/authorization.service';
import { PERMISSIONS } from 'src/modules/permission/constants/permission.constant';

import type { UnitOfWork } from 'src/shared/infrastructure/persistence/unit-of-work.interface';

import { AiGenerationStatus } from '../../../domain/enums/ai-generation-status.enum';
import type { AiGenerationRepository } from '../../../domain/repositories/ai-generation.repository';

import { PAGE_COMPOSITION_CAPABILITY } from '../../constants/page-composition.constant';
import { PAGE_COMPOSITION_SCHEMA_VERSION } from '../../types/page-composition-draft';

import type { PageCompositionDraftValidator } from '../../services/page-composition-draft-validator.service';
import type { PageCompositionExecutor } from '../../services/page-composition-executor.service';

import type { ApplyGenerationHandler } from '../apply-generation/apply-generation.handler';

import { ConfirmPageCompositionCommand } from './confirm-page-composition.command';
import { ConfirmPageCompositionHandler } from './confirm-page-composition.handler';
import { AiGeneration } from '../../../domain/aggregates/ai-generation/ai-generation.aggregate';
import { AiConversation } from '../../../domain/aggregates/ai-conversation/ai-conversation.aggregate';
import { AiConversationScope } from '../../../domain/enums/ai-conversation-scope.enum';
import { AiConversationAccessService } from '../../services/ai-conversation-access.service';
import { ApplyGenerationHandler as RealApplyGenerationHandler } from '../apply-generation/apply-generation.handler';
import type { AiConversationRepository } from '../../../domain/repositories/ai-conversation.repository';
import { AiConversationStatus } from '../../../domain/enums/ai-conversation-status.enum';
import { DiscardGenerationHandler } from '../discard-generation/discard-generation.handler';
import { DiscardGenerationCommand } from '../discard-generation/discard-generation.command';
import { PageCompositionDraftValidator as RealDraftValidator } from '../../services/page-composition-draft-validator.service';
import { Test } from '@nestjs/testing';
import { AI_ASSISTANT_TYPES } from '../../../ai-assistant.types';
import { CONTENT_TYPES } from 'src/modules/content/content.types';
import { PERSISTENCE_TYPES } from 'src/shared/infrastructure/persistence/persistence.types';
import { AuthorizationService as AuthorizationProvider } from 'src/modules/permission/application/services/authorization.service';
import { PageCompositionExecutor as ExecutorProvider } from '../../services/page-composition-executor.service';

function createSecurityFixture(
  options: {
    scope?: AiConversationScope;
    linked?: boolean;
    workspaceId?: string | null;
  } = {},
) {
  const base = createFixture();
  const scope = options.scope ?? AiConversationScope.PAGE;
  const conversation = AiConversation.restore({
    id: 'conversation-1',
    userId: 'user-1',
    workspaceId: 'workspace-1',
    scope,
    pageId: scope === AiConversationScope.PAGE ? 'page-private' : null,
    title: null,
    status: AiConversationStatus.ACTIVE,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  const generation = AiGeneration.create({
    id: 'generation-1',
    userId: 'user-1',
    workspaceId:
      options.workspaceId === undefined ? 'workspace-1' : options.workspaceId,
    conversationId: options.linked === false ? null : conversation.getId(),
    capability: PAGE_COMPOSITION_CAPABILITY,
    status: AiGenerationStatus.COMPLETED,
    outputData: base.draft,
  });
  const output = jest.spyOn(generation, 'getOutputData');
  const save = jest
    .fn()
    .mockImplementation((value: AiGeneration) => Promise.resolve(value));
  const repository = {
    findByIdAndUserIdForUpdate: jest.fn().mockResolvedValue(generation),
    findByIdAndUserId: jest.fn().mockResolvedValue(generation),
    save,
  };
  const findConversation = jest.fn().mockResolvedValue(conversation);
  const page = {
    getId: () => 'page-private',
    getDeletedAt: (): Date | null => null,
    getWorkspaceId: () => 'workspace-1',
  };
  const findPage = jest.fn().mockResolvedValue(page);
  const authorize = jest.fn(({ permissions }: AuthorizeParams) =>
    Promise.resolve(!permissions.includes(PERMISSIONS.PAGE_READ)),
  );
  const pages = { findById: findPage } as unknown as PageRepository;
  const authorization = { authorize } as unknown as AuthorizationService;
  const access = new AiConversationAccessService(pages, authorization);
  const apply = new RealApplyGenerationHandler(
    repository as unknown as AiGenerationRepository,
  );
  const applyExecute = jest.spyOn(apply, 'execute');
  const commit = jest.fn();
  const rollback = jest.fn();
  const unitOfWork = {
    runInTransaction: async (
      callback: (context: object) => Promise<unknown>,
    ) => {
      try {
        const result = await callback(base.context);
        commit();
        return result;
      } catch (error) {
        rollback();
        throw error;
      }
    },
  };
  const lock = jest.fn().mockResolvedValue(undefined);
  base.validate.mockImplementation((input: unknown) =>
    new RealDraftValidator().validate(input),
  );
  const handler = new ConfirmPageCompositionHandler(
    repository as unknown as AiGenerationRepository,
    pages,
    authorization,
    { validate: base.validate } as unknown as PageCompositionDraftValidator,
    { execute: base.executorExecute } as unknown as PageCompositionExecutor,
    apply,
    unitOfWork as UnitOfWork,
    {
      findByIdAndUserId: findConversation,
    } as unknown as AiConversationRepository,
    access,
    { lock },
  );
  return {
    ...base,
    handler,
    generation,
    conversation,
    output,
    save,
    repository,
    findConversation,
    page,
    findPage,
    authorize,
    applyExecute,
    apply,
    commit,
    rollback,
    lock,
    access,
    unitOfWork,
  };
}

describe('FIX05-A source authorization', () => {
  it('resolves the handler through existing DI tokens without duplicate providers or database bootstrap', async () => {
    const f = createSecurityFixture();
    f.authorize.mockResolvedValue(true);
    const module = await Test.createTestingModule({
      providers: [
        ConfirmPageCompositionHandler,
        {
          provide: AI_ASSISTANT_TYPES.repositories.AiGenerationRepository,
          useValue: f.repository,
        },
        {
          provide: CONTENT_TYPES.repositories.PageRepository,
          useValue: { findById: f.findPage },
        },
        {
          provide: AuthorizationProvider,
          useValue: { authorize: f.authorize },
        },
        { provide: RealDraftValidator, useValue: { validate: f.validate } },
        { provide: ExecutorProvider, useValue: { execute: f.executorExecute } },
        {
          provide: RealApplyGenerationHandler,
          useValue: f.apply,
        },
        { provide: PERSISTENCE_TYPES.UnitOfWork, useValue: f.unitOfWork },
        {
          provide: AI_ASSISTANT_TYPES.repositories.AiConversationRepository,
          useValue: { findByIdAndUserId: f.findConversation },
        },
        {
          provide: AI_ASSISTANT_TYPES.services.AiConversationAccess,
          useValue: f.access,
        },
        {
          provide: AI_ASSISTANT_TYPES.ports.PageContextTransactionLocker,
          useValue: { lock: f.lock },
        },
      ],
    }).compile();
    try {
      await expect(
        module
          .get(ConfirmPageCompositionHandler)
          .execute(new ConfirmPageCompositionCommand('user-1', 'generation-1')),
      ).resolves.toMatchObject({
        generation: { status: AiGenerationStatus.APPLIED },
      });
    } finally {
      await module.close();
    }
  });
  function expectNoUse(fixture: ReturnType<typeof createSecurityFixture>) {
    expect(fixture.output).not.toHaveBeenCalled();
    expect(fixture.validate).not.toHaveBeenCalled();
    expect(fixture.executorExecute).not.toHaveBeenCalled();
    expect(fixture.applyExecute).not.toHaveBeenCalled();
    expect(fixture.save).not.toHaveBeenCalled();
    expect(fixture.commit).not.toHaveBeenCalled();
    expect(fixture.rollback).toHaveBeenCalledTimes(1);
    expect(fixture.generation.getStatus()).toBe(AiGenerationStatus.COMPLETED);
  }

  it('confirms an authorized PAGE draft once using the same context and response contract', async () => {
    const f = createSecurityFixture();
    f.authorize.mockResolvedValue(true);
    const result = await f.handler.execute(
      new ConfirmPageCompositionCommand('user-1', 'generation-1'),
    );
    expect(f.repository.findByIdAndUserIdForUpdate).toHaveBeenCalledWith(
      'generation-1',
      'user-1',
      f.context,
    );
    expect(f.findConversation).toHaveBeenCalledWith(
      'conversation-1',
      'user-1',
      f.context,
    );
    expect(f.lock).toHaveBeenCalledWith('page-private', f.context, 'user-1');
    expect(f.findPage).toHaveBeenCalledWith('page-private', f.context);
    expect(
      f.authorize.mock.calls.map(([request]) => request.permissions),
    ).toEqual([[PERMISSIONS.PAGE_READ], [PERMISSIONS.PAGE_CREATE]]);
    expect(f.lock.mock.invocationCallOrder[0]).toBeLessThan(
      f.authorize.mock.invocationCallOrder[0],
    );
    expect(f.authorize.mock.invocationCallOrder[1]).toBeLessThan(
      f.output.mock.invocationCallOrder[0],
    );
    expect(f.executorExecute).toHaveBeenCalledTimes(1);
    expect(f.applyExecute).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        generationId: 'generation-1',
      }),
      f.context,
    );
    expect(f.save).toHaveBeenCalledWith(f.generation, f.context);
    expect(f.save).toHaveBeenCalledTimes(1);
    expect(f.commit).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({
      generation: {
        id: 'generation-1',
        status: AiGenerationStatus.APPLIED,
        output_data: f.draft,
      },
      execution: f.executionResult,
    });
  });

  it.each([
    AiConversationScope.GLOBAL,
    AiConversationScope.LEGACY,
    'unlinked',
  ] as const)(
    'preserves authorized %s drafts with WORKSPACE_READ and PAGE_CREATE',
    async (scope) => {
      const f = createSecurityFixture(
        scope === 'unlinked' ? { linked: false } : { scope },
      );
      await expect(
        f.handler.execute(
          new ConfirmPageCompositionCommand('user-1', 'generation-1'),
        ),
      ).resolves.toMatchObject({
        generation: { status: AiGenerationStatus.APPLIED },
      });
      expect(
        f.authorize.mock.calls.map(([request]) => request.permissions),
      ).toEqual([[PERMISSIONS.WORKSPACE_READ], [PERMISSIONS.PAGE_CREATE]]);
      expect(f.lock).not.toHaveBeenCalled();
      expect(f.executorExecute).toHaveBeenCalledTimes(1);
      expect(f.findConversation).toHaveBeenCalledTimes(
        scope === 'unlinked' ? 0 : 1,
      );
    },
  );

  it.each([
    AiConversationScope.GLOBAL,
    AiConversationScope.LEGACY,
    'unlinked',
  ] as const)(
    'denies %s drafts when workspace read is revoked',
    async (scope) => {
      const f = createSecurityFixture(
        scope === 'unlinked' ? { linked: false } : { scope },
      );
      f.authorize.mockImplementation(({ permissions }) =>
        Promise.resolve(permissions.includes(PERMISSIONS.PAGE_CREATE)),
      );
      await expect(
        f.handler.execute(
          new ConfirmPageCompositionCommand('user-1', 'generation-1'),
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expectNoUse(f);
    },
  );

  it.each([true, false])(
    'fails closed without a generation workspace (linked=%s)',
    async (linked) => {
      const f = createSecurityFixture({ linked, workspaceId: null });
      await expect(
        f.handler.execute(
          new ConfirmPageCompositionCommand('user-1', 'generation-1'),
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
      expectNoUse(f);
    },
  );

  it.each(['valid', 'invalid', 'expired', 'revoked', 'wrong-page'])(
    'delegates %s token to effective source policy without granting destination access',
    async (token) => {
      const f = createSecurityFixture();
      f.authorize.mockImplementation(({ permissions, shareToken, target }) =>
        Promise.resolve(
          permissions.includes(PERMISSIONS.PAGE_CREATE) ||
            (shareToken === 'valid' && target.id === 'page-private'),
        ),
      );
      const result = f.handler.execute(
        new ConfirmPageCompositionCommand(
          'user-1',
          'generation-1',
          null,
          null,
          token,
        ),
      );
      if (token === 'valid') {
        await expect(result).resolves.toMatchObject({
          generation: { status: AiGenerationStatus.APPLIED },
        });
        expect(f.authorize).toHaveBeenLastCalledWith({
          userId: 'user-1',
          permissions: [PERMISSIONS.PAGE_CREATE],
          target: { type: 'workspace', id: 'workspace-1' },
        });
      } else {
        await expect(result).rejects.toBeInstanceOf(ForbiddenException);
        expectNoUse(f);
      }
      expect(f.authorize).toHaveBeenCalledWith({
        userId: 'user-1',
        permissions: [PERMISSIONS.PAGE_READ],
        target: { type: 'page', id: 'page-private' },
        shareToken: token,
      });
    },
  );

  it('allows direct source read even with an invalid token', async () => {
    const f = createSecurityFixture();
    f.authorize.mockResolvedValue(true);
    await expect(
      f.handler.execute(
        new ConfirmPageCompositionCommand(
          'user-1',
          'generation-1',
          null,
          null,
          'invalid',
        ),
      ),
    ).resolves.toMatchObject({
      generation: { status: AiGenerationStatus.APPLIED },
    });
  });

  it.each([undefined, 'valid'])(
    'denies destination creation even with source access (token=%s)',
    async (token) => {
      const f = createSecurityFixture();
      f.authorize.mockImplementation(({ permissions }) =>
        Promise.resolve(permissions.includes(PERMISSIONS.PAGE_READ)),
      );
      await expect(
        f.handler.execute(
          new ConfirmPageCompositionCommand(
            'user-1',
            'generation-1',
            null,
            null,
            token,
          ),
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(f.authorize).toHaveBeenCalledTimes(2);
      expectNoUse(f);
    },
  );

  it.each([
    'missing conversation',
    'foreign conversation',
    'workspace mismatch',
    'missing page',
    'deleted page',
    'foreign page workspace',
    'missing page id',
    'authorization error',
    'lock error',
  ])(
    'fails closed for %s before output access or mutation',
    async (scenario) => {
      const f = createSecurityFixture();
      f.authorize.mockResolvedValue(true);
      let expected: typeof Error = ForbiddenException;
      switch (scenario) {
        case 'missing conversation':
          f.findConversation.mockResolvedValue(null);
          expected = NotFoundException;
          break;
        case 'foreign conversation':
          jest.spyOn(f.conversation, 'getUserId').mockReturnValue('other');
          expected = NotFoundException;
          break;
        case 'workspace mismatch':
          jest.spyOn(f.conversation, 'getWorkspaceId').mockReturnValue('other');
          break;
        case 'missing page':
          f.findPage.mockResolvedValue(null);
          expected = NotFoundException;
          break;
        case 'deleted page':
          jest
            .spyOn(f.page, 'getDeletedAt')
            .mockReturnValue(new Date() as never);
          expected = NotFoundException;
          break;
        case 'foreign page workspace':
          jest.spyOn(f.page, 'getWorkspaceId').mockReturnValue('other');
          break;
        // Domain construction rejects this malformed state; simulate a corrupt adapter.
        case 'missing page id':
          jest.spyOn(f.conversation, 'getPageId').mockReturnValue(null);
          break;
        case 'authorization error':
          f.authorize.mockRejectedValue(new Error('policy unavailable'));
          expected = Error;
          break;
        case 'lock error':
          f.lock.mockRejectedValue(new Error('lock unavailable'));
          expected = Error;
          break;
      }
      await expect(
        f.handler.execute(
          new ConfirmPageCompositionCommand('user-1', 'generation-1'),
        ),
      ).rejects.toBeInstanceOf(expected);
      expectNoUse(f);
    },
  );

  it.each(['missing', 'foreign'])(
    'rejects %s generation ownership before source lookup',
    async (scenario) => {
      const f = createSecurityFixture();
      if (scenario === 'missing')
        f.repository.findByIdAndUserIdForUpdate.mockResolvedValue(null);
      else jest.spyOn(f.generation, 'getUserId').mockReturnValue('other');
      await expect(
        f.handler.execute(
          new ConfirmPageCompositionCommand('user-1', 'generation-1'),
        ),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(f.findConversation).not.toHaveBeenCalled();
      expectNoUse(f);
    },
  );

  it.each([
    AiGenerationStatus.PROCESSING,
    AiGenerationStatus.FAILED,
    AiGenerationStatus.APPLIED,
    AiGenerationStatus.DISCARDED,
  ])('rejects status %s without accessing output', async (status) => {
    const f = createSecurityFixture();
    jest.spyOn(f.generation, 'getStatus').mockReturnValue(status);
    await expect(
      f.handler.execute(
        new ConfirmPageCompositionCommand('user-1', 'generation-1'),
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(f.output).not.toHaveBeenCalled();
    expect(f.executorExecute).not.toHaveBeenCalled();
    expect(f.applyExecute).not.toHaveBeenCalled();
    expect(f.save).not.toHaveBeenCalled();
  });

  it('rejects persisted invalid output using the real draft validator', async () => {
    const f = createSecurityFixture();
    f.authorize.mockResolvedValue(true);
    f.output.mockReturnValue({ private: 'synthetic invalid draft' });
    await expect(
      f.handler.execute(
        new ConfirmPageCompositionCommand('user-1', 'generation-1'),
      ),
    ).rejects.toThrow('invalid page composition draft');
    expect(f.executorExecute).not.toHaveBeenCalled();
    expect(f.applyExecute).not.toHaveBeenCalled();
    expect(f.save).not.toHaveBeenCalled();
    expect(f.generation.getStatus()).toBe(AiGenerationStatus.COMPLETED);
    expect(f.rollback).toHaveBeenCalledTimes(1);
  });

  it.each([null, new Date()])(
    'rejects missing/deleted destination parent after source authorization (%s)',
    async (deletedAt) => {
      const f = createSecurityFixture();
      f.authorize.mockResolvedValue(true);
      f.findPage.mockImplementation((id: string) =>
        Promise.resolve(
          id === 'page-private'
            ? f.page
            : deletedAt === null
              ? null
              : { ...f.page, getDeletedAt: () => deletedAt },
        ),
      );
      await expect(
        f.handler.execute(
          new ConfirmPageCompositionCommand(
            'user-1',
            'generation-1',
            null,
            'parent-1',
          ),
        ),
      ).rejects.toBeInstanceOf(NotFoundException);
      expectNoUse(f);
    },
  );

  it('rolls back an executor error without applying or saving the generation', async () => {
    const f = createSecurityFixture();
    f.authorize.mockResolvedValue(true);
    f.executorExecute.mockRejectedValue(new Error('executor failed'));
    await expect(
      f.handler.execute(
        new ConfirmPageCompositionCommand('user-1', 'generation-1'),
      ),
    ).rejects.toThrow('executor failed');
    expect(f.executorExecute).toHaveBeenCalledTimes(1);
    expect(f.applyExecute).not.toHaveBeenCalled();
    expect(f.save).not.toHaveBeenCalled();
    expect(f.generation.getStatus()).toBe(AiGenerationStatus.COMPLETED);
    expect(f.commit).not.toHaveBeenCalled();
    expect(f.rollback).toHaveBeenCalledTimes(1);
  });

  it('denies PAGE composition confirm after PAGE_READ revocation even when PAGE_CREATE is allowed', async () => {
    const fixture = createSecurityFixture();
    await expect(
      fixture.handler.execute(
        new ConfirmPageCompositionCommand('user-1', 'generation-1'),
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(fixture.authorize).toHaveBeenCalledWith(
      expect.objectContaining({
        permissions: [PERMISSIONS.PAGE_READ],
        target: { type: 'page', id: 'page-private' },
      }),
    );
    expect(fixture.output).not.toHaveBeenCalled();
    expect(fixture.executorExecute).not.toHaveBeenCalled();
    expect(fixture.applyExecute).not.toHaveBeenCalled();
    expect(fixture.save).not.toHaveBeenCalled();
    expect(fixture.generation.getStatus()).toBe(AiGenerationStatus.COMPLETED);
    expect(fixture.commit).not.toHaveBeenCalled();
    expect(fixture.rollback).toHaveBeenCalledTimes(1);
  });
});

describe('FIX05-A Composition Confirm concurrency (in-memory locks)', () => {
  function setup() {
    const f = createSecurityFixture();
    f.authorize.mockResolvedValue(true);
    let tail = Promise.resolve();
    f.repository.findByIdAndUserIdForUpdate.mockImplementation(
      async (_id: string, _user: string, context: { unlock: () => void }) => {
        const wait = tail;
        tail = new Promise<void>((resolve) => {
          context.unlock = resolve;
        });
        await wait;
        return f.generation;
      },
    );
    // Each request gets its own context. Locks are released only at transaction
    // completion; this simulates scheduling, not PostgreSQL isolation.
    f.unitOfWork.runInTransaction = async (callback) => {
      const context = { unlock: () => undefined };
      try {
        return await callback(context);
      } finally {
        context.unlock();
      }
    };
    const discard = new DiscardGenerationHandler(
      f.repository as unknown as AiGenerationRepository,
      f.unitOfWork as UnitOfWork,
      {
        findByIdAndUserId: f.findConversation,
      } as unknown as AiConversationRepository,
      f.access,
    );
    let release!: () => void;
    let started!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const executing = new Promise<void>((resolve) => {
      started = resolve;
    });
    f.executorExecute.mockImplementation(async () => {
      started();
      await gate;
      return f.executionResult;
    });
    return { ...f, discard, release, executing };
  }
  const confirm = new ConfirmPageCompositionCommand('user-1', 'generation-1');
  const discard = new DiscardGenerationCommand('user-1', 'generation-1');

  it('serializes Confirm/Confirm and executes and saves once', async () => {
    const f = setup();
    const first = f.handler.execute(confirm);
    await f.executing;
    const second = f.handler.execute(confirm);
    const rejected = expect(second).rejects.toBeInstanceOf(BadRequestException);
    f.release();
    await expect(first).resolves.toMatchObject({
      generation: { status: AiGenerationStatus.APPLIED },
    });
    await rejected;
    expect(f.executorExecute).toHaveBeenCalledTimes(1);
    expect(f.save).toHaveBeenCalledTimes(1);
  });

  it('serializes Confirm/Discard without changing APPLIED', async () => {
    const f = setup();
    const first = f.handler.execute(confirm);
    await f.executing;
    const second = f.discard.execute(discard);
    const rejected = expect(second).rejects.toBeInstanceOf(ConflictException);
    f.release();
    await first;
    await rejected;
    expect(f.generation.getStatus()).toBe(AiGenerationStatus.APPLIED);
    expect(f.executorExecute).toHaveBeenCalledTimes(1);
    expect(f.save).toHaveBeenCalledTimes(1);
  });

  it('serializes Discard/Confirm without executing a discarded draft', async () => {
    const f = setup();
    const first = f.discard.execute(discard);
    const second = f.handler.execute(confirm);
    const rejected = expect(second).rejects.toBeInstanceOf(BadRequestException);
    await first;
    await rejected;
    expect(f.generation.getStatus()).toBe(AiGenerationStatus.DISCARDED);
    expect(f.executorExecute).not.toHaveBeenCalled();
    expect(f.save).toHaveBeenCalledTimes(1);
  });

  it('releases the lock after failed execution and allows one authorized retry', async () => {
    const f = setup();
    f.executorExecute.mockRejectedValueOnce(new Error('execution failed'));
    const first = f.handler.execute(confirm);
    const failed = expect(first).rejects.toThrow('execution failed');
    const second = f.handler.execute(confirm);
    f.release();
    await failed;
    await expect(second).resolves.toMatchObject({
      generation: { status: AiGenerationStatus.APPLIED },
    });
    expect(f.executorExecute).toHaveBeenCalledTimes(2);
    expect(f.save).toHaveBeenCalledTimes(1);
  });
});

function createFixture() {
  const draft = {
    schemaVersion: PAGE_COMPOSITION_SCHEMA_VERSION,
    type: 'PAGE_COMPOSITION' as const,
    page: {
      title: 'Sprint Planning',
    },
    blocks: [],
    databases: [],
  };

  const generation = {
    getUserId: jest.fn().mockReturnValue('user-1'),
    getConversationId: jest.fn().mockReturnValue(null),
    getCapability: jest.fn().mockReturnValue(PAGE_COMPOSITION_CAPABILITY),

    getStatus: jest.fn().mockReturnValue(AiGenerationStatus.COMPLETED),

    getWorkspaceId: jest.fn().mockReturnValue('workspace-1'),

    getOutputData: jest.fn().mockReturnValue(draft),
  };

  const findByIdAndUserIdForUpdate = jest.fn().mockResolvedValue(generation);

  const findPageById = jest.fn();

  const authorize = jest.fn().mockResolvedValue(true);

  const validate = jest.fn().mockReturnValue(draft);

  const executionResult = {
    pageId: 'page-1',
    blockIds: {},
    databaseIds: {},
    propertyIds: {},
    optionIds: {},
    viewIds: {},
    rowIds: {},
  };

  const executorExecute = jest.fn().mockResolvedValue(executionResult);

  const appliedGeneration = {
    id: 'generation-1',
    status: AiGenerationStatus.APPLIED,
  };

  const applyGenerationExecute = jest
    .fn<
      Promise<typeof appliedGeneration>,
      Parameters<ApplyGenerationHandler['execute']>
    >()
    .mockResolvedValue(appliedGeneration);

  const context = {};

  const runInTransaction = jest.fn(
    async (callback: (context: unknown) => Promise<unknown>) =>
      await callback(context),
  );

  const handler = new ConfirmPageCompositionHandler(
    {
      findByIdAndUserIdForUpdate,
    } as unknown as AiGenerationRepository,

    {
      findById: findPageById,
    } as unknown as PageRepository,

    {
      authorize,
    } as unknown as AuthorizationService,

    {
      validate,
    } as unknown as PageCompositionDraftValidator,

    {
      execute: executorExecute,
    } as unknown as PageCompositionExecutor,

    {
      execute: applyGenerationExecute,
    } as unknown as ApplyGenerationHandler,

    {
      runInTransaction,
    } as unknown as UnitOfWork,
    { findByIdAndUserId: jest.fn() } as unknown as AiConversationRepository,
    {
      assertWorkspaceRead: jest.fn().mockResolvedValue(undefined),
    } as unknown as AiConversationAccessService,
    { lock: jest.fn() },
  );

  return {
    handler,

    draft,
    generation,

    context,

    executionResult,
    appliedGeneration,

    findByIdAndUserIdForUpdate,
    findPageById,
    authorize,
    validate,
    executorExecute,
    applyGenerationExecute,
    runInTransaction,
  };
}

describe('ConfirmPageCompositionHandler', () => {
  it('re-authorizes, revalidates, executes, and applies a completed page composition generation', async () => {
    const fixture = createFixture();

    const result = await fixture.handler.execute(
      new ConfirmPageCompositionCommand('user-1', 'generation-1'),
    );

    expect(fixture.runInTransaction).toHaveBeenCalledTimes(1);

    expect(fixture.findByIdAndUserIdForUpdate).toHaveBeenCalledWith(
      'generation-1',
      'user-1',
      fixture.context,
    );

    expect(fixture.authorize).toHaveBeenCalledWith({
      userId: 'user-1',
      permissions: [PERMISSIONS.PAGE_CREATE],
      target: {
        type: 'workspace',
        id: 'workspace-1',
      },
    });

    expect(fixture.validate).toHaveBeenCalledWith(fixture.draft);

    expect(fixture.executorExecute).toHaveBeenCalledWith({
      userId: 'user-1',
      workspaceId: 'workspace-1',
      teamspaceId: null,
      parentPageId: null,
      draft: fixture.draft,
    });

    expect(fixture.applyGenerationExecute).toHaveBeenCalledTimes(1);

    const [applyCommand, applyContext] =
      fixture.applyGenerationExecute.mock.calls[0];

    expect(applyCommand.userId).toBe('user-1');
    expect(applyCommand.generationId).toBe('generation-1');

    expect(applyContext).toBe(fixture.context);

    expect(result).toEqual({
      generation: fixture.appliedGeneration,
      execution: fixture.executionResult,
    });
  });

  it('authorizes against the requested teamspace when creating a root page in a teamspace', async () => {
    const fixture = createFixture();

    await fixture.handler.execute(
      new ConfirmPageCompositionCommand(
        'user-1',
        'generation-1',
        'teamspace-1',
      ),
    );

    expect(fixture.findPageById).not.toHaveBeenCalled();

    expect(fixture.authorize).toHaveBeenCalledWith({
      userId: 'user-1',
      permissions: [PERMISSIONS.PAGE_CREATE],
      target: {
        type: 'teamspace',
        id: 'teamspace-1',
        workspaceId: 'workspace-1',
      },
    });

    expect(fixture.executorExecute).toHaveBeenCalledWith(
      expect.objectContaining({
        workspaceId: 'workspace-1',
        teamspaceId: 'teamspace-1',
        parentPageId: null,
      }),
    );
  });

  it('resolves the effective teamspace from the parent page before authorization', async () => {
    const fixture = createFixture();

    fixture.findPageById.mockResolvedValue({
      getDeletedAt: jest.fn().mockReturnValue(null),
      getWorkspaceId: jest.fn().mockReturnValue('workspace-1'),
      getTeamspaceId: jest.fn().mockReturnValue('teamspace-parent'),
    });

    await fixture.handler.execute(
      new ConfirmPageCompositionCommand(
        'user-1',
        'generation-1',
        undefined,
        'parent-page-1',
      ),
    );

    expect(fixture.findPageById).toHaveBeenCalledWith(
      'parent-page-1',
      fixture.context,
    );

    expect(fixture.authorize).toHaveBeenCalledWith({
      userId: 'user-1',
      permissions: [PERMISSIONS.PAGE_CREATE],
      target: {
        type: 'teamspace',
        id: 'teamspace-parent',
        workspaceId: 'workspace-1',
      },
    });

    expect(fixture.executorExecute).toHaveBeenCalledWith(
      expect.objectContaining({
        workspaceId: 'workspace-1',
        teamspaceId: 'teamspace-parent',
        parentPageId: 'parent-page-1',
      }),
    );
  });

  it('rejects a parent page from another workspace before execution', async () => {
    const fixture = createFixture();

    fixture.findPageById.mockResolvedValue({
      getDeletedAt: jest.fn().mockReturnValue(null),
      getWorkspaceId: jest.fn().mockReturnValue('workspace-2'),
      getTeamspaceId: jest.fn().mockReturnValue(null),
    });

    await expect(
      fixture.handler.execute(
        new ConfirmPageCompositionCommand(
          'user-1',
          'generation-1',
          undefined,
          'parent-page-1',
        ),
      ),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(fixture.authorize).not.toHaveBeenCalled();
    expect(fixture.validate).not.toHaveBeenCalled();
    expect(fixture.executorExecute).not.toHaveBeenCalled();
    expect(fixture.applyGenerationExecute).not.toHaveBeenCalled();
  });

  it('rejects an explicit teamspace that conflicts with the parent page teamspace', async () => {
    const fixture = createFixture();

    fixture.findPageById.mockResolvedValue({
      getDeletedAt: jest.fn().mockReturnValue(null),
      getWorkspaceId: jest.fn().mockReturnValue('workspace-1'),
      getTeamspaceId: jest.fn().mockReturnValue('teamspace-parent'),
    });

    await expect(
      fixture.handler.execute(
        new ConfirmPageCompositionCommand(
          'user-1',
          'generation-1',
          'teamspace-other',
          'parent-page-1',
        ),
      ),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(fixture.authorize).not.toHaveBeenCalled();
    expect(fixture.executorExecute).not.toHaveBeenCalled();
    expect(fixture.applyGenerationExecute).not.toHaveBeenCalled();
  });

  it('rejects when the generation does not exist for the user', async () => {
    const fixture = createFixture();

    fixture.findByIdAndUserIdForUpdate.mockResolvedValue(null);

    await expect(
      fixture.handler.execute(
        new ConfirmPageCompositionCommand('user-1', 'generation-1'),
      ),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(fixture.authorize).not.toHaveBeenCalled();
    expect(fixture.validate).not.toHaveBeenCalled();
    expect(fixture.executorExecute).not.toHaveBeenCalled();
    expect(fixture.applyGenerationExecute).not.toHaveBeenCalled();
  });

  it('rejects a generation with another capability', async () => {
    const fixture = createFixture();

    fixture.generation.getCapability.mockReturnValue('writing.improve');

    await expect(
      fixture.handler.execute(
        new ConfirmPageCompositionCommand('user-1', 'generation-1'),
      ),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(fixture.authorize).not.toHaveBeenCalled();
    expect(fixture.validate).not.toHaveBeenCalled();
    expect(fixture.executorExecute).not.toHaveBeenCalled();
    expect(fixture.applyGenerationExecute).not.toHaveBeenCalled();
  });

  it('rejects a generation that is not completed', async () => {
    const fixture = createFixture();

    fixture.generation.getStatus.mockReturnValue(AiGenerationStatus.PROCESSING);

    await expect(
      fixture.handler.execute(
        new ConfirmPageCompositionCommand('user-1', 'generation-1'),
      ),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(fixture.authorize).not.toHaveBeenCalled();
    expect(fixture.validate).not.toHaveBeenCalled();
    expect(fixture.executorExecute).not.toHaveBeenCalled();
    expect(fixture.applyGenerationExecute).not.toHaveBeenCalled();
  });

  it('does not execute or apply when re-authorization fails', async () => {
    const fixture = createFixture();

    fixture.authorize.mockResolvedValue(false);

    await expect(
      fixture.handler.execute(
        new ConfirmPageCompositionCommand('user-1', 'generation-1'),
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(fixture.validate).not.toHaveBeenCalled();

    expect(fixture.executorExecute).not.toHaveBeenCalled();

    expect(fixture.applyGenerationExecute).not.toHaveBeenCalled();
  });

  it('does not execute or apply when re-validation fails', async () => {
    const fixture = createFixture();

    fixture.validate.mockImplementation(() => {
      throw new BadRequestException(
        'AI returned an invalid page composition draft',
      );
    });

    await expect(
      fixture.handler.execute(
        new ConfirmPageCompositionCommand('user-1', 'generation-1'),
      ),
    ).rejects.toThrow('AI returned an invalid page composition draft');

    expect(fixture.authorize).toHaveBeenCalledTimes(1);

    expect(fixture.executorExecute).not.toHaveBeenCalled();

    expect(fixture.applyGenerationExecute).not.toHaveBeenCalled();
  });

  it('does not mark the generation applied when execution fails', async () => {
    const fixture = createFixture();

    fixture.executorExecute.mockRejectedValue(new Error('execution failed'));

    await expect(
      fixture.handler.execute(
        new ConfirmPageCompositionCommand('user-1', 'generation-1'),
      ),
    ).rejects.toThrow('execution failed');

    expect(fixture.validate).toHaveBeenCalledTimes(1);

    expect(fixture.executorExecute).toHaveBeenCalledTimes(1);

    expect(fixture.applyGenerationExecute).not.toHaveBeenCalled();
  });

  it('performs authorization and validation before execution, and applies only after execution', async () => {
    const fixture = createFixture();

    await fixture.handler.execute(
      new ConfirmPageCompositionCommand('user-1', 'generation-1'),
    );

    const authorizeOrder = fixture.authorize.mock.invocationCallOrder[0];

    const validateOrder = fixture.validate.mock.invocationCallOrder[0];

    const executeOrder = fixture.executorExecute.mock.invocationCallOrder[0];

    const applyOrder =
      fixture.applyGenerationExecute.mock.invocationCallOrder[0];

    expect(authorizeOrder).toBeLessThan(validateOrder);
    expect(validateOrder).toBeLessThan(executeOrder);
    expect(executeOrder).toBeLessThan(applyOrder);
  });
});
