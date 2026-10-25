import { AiGenerationResponseDto } from '../../dto/response/ai-generation.response.dto';
import { AiConversationStatus } from '../../../domain/enums/ai-conversation-status.enum';
import { ForbiddenException } from '@nestjs/common';
import { Page } from 'src/modules/content/domain/aggregates/page/page.aggregate';
import type { PageRepository } from 'src/modules/content/domain/repositories/page.repository';
import type { AuthorizationService } from 'src/modules/permission/application/services/authorization.service';
import { PERMISSIONS } from 'src/modules/permission/constants/permission.constant';
import type { AiConversationRepository } from '../../../domain/repositories/ai-conversation.repository';
import { AiConversation } from '../../../domain/aggregates/ai-conversation/ai-conversation.aggregate';
import { AiConversationScope } from '../../../domain/enums/ai-conversation-scope.enum';
import { AiConversationAccessService } from '../../services/ai-conversation-access.service';
import { ConflictException, NotFoundException } from '@nestjs/common';
import type { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';
import type { UnitOfWork } from 'src/shared/infrastructure/persistence/unit-of-work.interface';
import { AiGeneration } from '../../../domain/aggregates/ai-generation/ai-generation.aggregate';
import { AiGenerationStatus } from '../../../domain/enums/ai-generation-status.enum';
import type { AiGenerationRepository } from '../../../domain/repositories/ai-generation.repository';
import { DiscardGenerationCommand } from './discard-generation.command';
import { DiscardGenerationHandler } from './discard-generation.handler';

describe('DiscardGenerationHandler transaction safety', () => {
  const context: PersistenceContext = { transaction: 'active' };
  const command = new DiscardGenerationCommand('user-1', 'generation-1');

  function setup(initialStatus = AiGenerationStatus.COMPLETED) {
    const generation = AiGeneration.create({
      id: 'generation-1',
      userId: 'user-1',
      capability: 'WRITE',
      status: initialStatus,
    });
    const findByIdAndUserIdForUpdate = jest.fn().mockResolvedValue(generation);
    const save = jest.fn((value: AiGeneration) => Promise.resolve(value));
    const runInTransaction = jest.fn(
      async (fn: (ctx: PersistenceContext) => Promise<unknown>) => fn(context),
    );
    const handler = new DiscardGenerationHandler(
      { findByIdAndUserIdForUpdate, save } as unknown as AiGenerationRepository,
      { runInTransaction } as unknown as UnitOfWork,
      {} as AiConversationRepository,
      new AiConversationAccessService(
        {} as PageRepository,
        {} as AuthorizationService,
      ),
    );

    return {
      handler,
      generation,
      findByIdAndUserIdForUpdate,
      save,
      runInTransaction,
    };
  }

  it('locks, discards and saves using the same transaction context', async () => {
    const fixture = setup();
    const result = await fixture.handler.execute(command);

    expect(fixture.runInTransaction).toHaveBeenCalledTimes(1);
    expect(fixture.findByIdAndUserIdForUpdate).toHaveBeenCalledWith(
      'generation-1',
      'user-1',
      context,
    );
    expect(fixture.save).toHaveBeenCalledWith(fixture.generation, context);
    expect(result.status).toBe(AiGenerationStatus.DISCARDED);
  });

  it('reuses an explicitly provided transaction rather than opening another', async () => {
    const fixture = setup();
    await fixture.handler.execute(command, context);

    expect(fixture.runInTransaction).not.toHaveBeenCalled();
    expect(fixture.findByIdAndUserIdForUpdate).toHaveBeenCalledWith(
      'generation-1',
      'user-1',
      context,
    );
  });

  it('rejects a discarded generation without saving a second time', async () => {
    const fixture = setup();
    await fixture.handler.execute(command);

    await expect(fixture.handler.execute(command)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(fixture.save).toHaveBeenCalledTimes(1);
  });

  it('cannot discard a generation already applied by Confirm', async () => {
    const fixture = setup(AiGenerationStatus.APPLIED);

    await expect(fixture.handler.execute(command)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(fixture.save).not.toHaveBeenCalled();
  });

  it('fails safely if the owned generation does not exist', async () => {
    const fixture = setup();
    fixture.findByIdAndUserIdForUpdate.mockResolvedValue(null);

    await expect(fixture.handler.execute(command)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(fixture.save).not.toHaveBeenCalled();
  });

  it('propagates database failures for UnitOfWork to roll back', async () => {
    const fixture = setup();
    fixture.save.mockRejectedValue(new Error('database write failed'));

    await expect(fixture.handler.execute(command)).rejects.toThrow(
      'database write failed',
    );
    expect(fixture.runInTransaction).toHaveBeenCalledTimes(1);
  });
});

describe('DiscardGenerationHandler F-02 regression', () => {
  it('denies revoked PAGE_READ even when WORKSPACE_READ is allowed', async () => {
    const generation = AiGeneration.create({
      id: 'generation-1',
      userId: 'user-1',
      workspaceId: 'workspace-1',
      conversationId: 'conversation-1',
      capability: 'WRITE',
      status: AiGenerationStatus.COMPLETED,
      outputData: { private: 'secret' },
    });
    const conversation = AiConversation.create({
      id: 'conversation-1',
      userId: 'user-1',
      workspaceId: 'workspace-1',
      scope: AiConversationScope.PAGE,
      pageId: 'page-1',
    });
    const page = new Page(
      'page-1',
      'workspace-1',
      'Private',
      null,
      null,
      null,
      null,
      null,
      null,
      'user-1',
      new Date(),
      new Date(),
    );
    const authorize = jest.fn(({ permissions }: { permissions: string[] }) =>
      Promise.resolve(permissions.includes(PERMISSIONS.WORKSPACE_READ)),
    );
    const access = new AiConversationAccessService(
      {
        findById: jest.fn().mockResolvedValue(page),
      } as unknown as PageRepository,
      { authorize } as unknown as AuthorizationService,
    );
    const save = jest.fn((value: AiGeneration) => Promise.resolve(value));
    const handler = new DiscardGenerationHandler(
      {
        findByIdAndUserIdForUpdate: jest.fn().mockResolvedValue(generation),
        save,
      } as unknown as AiGenerationRepository,
      { runInTransaction: async (fn) => fn({}) } as UnitOfWork,
      {
        findByIdAndUserId: jest.fn().mockResolvedValue(conversation),
      } as unknown as AiConversationRepository,
      access,
    );
    await expect(
      handler.execute(new DiscardGenerationCommand('user-1', 'generation-1')),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(save).not.toHaveBeenCalled();
    expect(generation.getStatus()).toBe(AiGenerationStatus.COMPLETED);
    expect(authorize).toHaveBeenCalledWith(
      expect.objectContaining({
        permissions: [PERMISSIONS.PAGE_READ],
        target: { type: 'page', id: 'page-1' },
      }),
    );
  });
});

describe('DiscardGenerationHandler access boundaries', () => {
  const context: PersistenceContext = { transaction: 'security-test' };
  const privateOutput = { private: 'offline-only secret' };
  type Options = {
    scope?: AiConversationScope;
    unlinked?: boolean;
    workspace?: string | null;
    conversationWorkspace?: string | null;
    conversationOwner?: string;
    generationOwner?: string;
    plan?: boolean;
    input?: unknown;
    pageWorkspace?: string;
    missingPage?: boolean;
    deletedPage?: boolean;
    missingConversation?: boolean;
    missingPageScope?: boolean;
    pageAllowed?: boolean;
    workspaceAllowed?: boolean;
    tokenOnly?: boolean;
    token?: string;
    status?: AiGenerationStatus;
  };
  function setup(o: Options = {}) {
    const workspace = o.workspace === undefined ? 'workspace-1' : o.workspace;
    const generation = AiGeneration.create({
      id: 'generation-1',
      userId: o.generationOwner ?? 'user-1',
      workspaceId: workspace,
      conversationId: o.unlinked ? null : 'conversation-1',
      capability: o.plan ? 'GENERATE_PAGE_MODIFICATION_PLAN' : 'WRITE',
      inputData: (o.input === undefined
        ? { pageId: 'page-1', pageContextFingerprint: 'stale' }
        : o.input) as Record<string, unknown>,
      outputData: privateOutput,
      status: o.status ?? AiGenerationStatus.COMPLETED,
    });
    const scope = o.scope ?? AiConversationScope.PAGE;
    const conversation = AiConversation.restore({
      id: 'conversation-1',
      userId: o.conversationOwner ?? 'user-1',
      workspaceId:
        o.conversationWorkspace === undefined
          ? workspace
          : o.conversationWorkspace,
      scope,
      pageId: scope === AiConversationScope.PAGE ? 'page-1' : null,
      title: null,
      status: AiConversationStatus.ACTIVE,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    if (o.missingPageScope)
      jest.spyOn(conversation, 'getPageId').mockReturnValue(null);
    const page = new Page(
      'page-1',
      o.pageWorkspace ?? 'workspace-1',
      'Private',
      null,
      null,
      null,
      null,
      null,
      null,
      'user-1',
      new Date(),
      new Date(),
      o.deletedPage ? new Date() : null,
    );
    const authorize = jest.fn(
      (request: {
        permissions: string[];
        shareToken?: string;
        target: { id: string };
      }) => {
        if (request.permissions.includes(PERMISSIONS.WORKSPACE_READ))
          return Promise.resolve(o.workspaceAllowed ?? true);
        return Promise.resolve(
          o.tokenOnly
            ? request.shareToken === 'valid-page-1' &&
                request.target.id === 'page-1'
            : (o.pageAllowed ?? true),
        );
      },
    );
    const findPage = jest.fn().mockResolvedValue(o.missingPage ? null : page);
    const access = new AiConversationAccessService(
      { findById: findPage } as unknown as PageRepository,
      { authorize } as unknown as AuthorizationService,
    );
    const findConversation = jest
      .fn()
      .mockResolvedValue(o.missingConversation ? null : conversation);
    const findGeneration = jest.fn().mockResolvedValue(generation);
    const save = jest.fn((value: AiGeneration) => Promise.resolve(value));
    const runInTransaction = jest.fn(
      async (fn: (ctx: PersistenceContext) => Promise<unknown>) => fn(context),
    );
    const handler = new DiscardGenerationHandler(
      {
        findByIdAndUserIdForUpdate: findGeneration,
        save,
      } as unknown as AiGenerationRepository,
      { runInTransaction } as unknown as UnitOfWork,
      {
        findByIdAndUserId: findConversation,
      } as unknown as AiConversationRepository,
      access,
    );
    return {
      handler,
      generation,
      save,
      authorize,
      findPage,
      findConversation,
      findGeneration,
      runInTransaction,
      command: new DiscardGenerationCommand('user-1', 'generation-1', o.token),
    };
  }
  afterEach(() => jest.restoreAllMocks());

  it.each<[string, Options]>([
    ['PAGE', {}],
    ['GLOBAL', { scope: AiConversationScope.GLOBAL }],
    ['LEGACY workspace', { scope: AiConversationScope.LEGACY }],
    [
      'LEGACY null workspace',
      { scope: AiConversationScope.LEGACY, workspace: null },
    ],
    ['unlinked workspace', { unlinked: true }],
    ['unlinked null workspace', { unlinked: true, workspace: null }],
    ['valid policy token', { tokenOnly: true, token: 'valid-page-1' }],
    ['stale linked plan', { plan: true }],
    ['stale unlinked plan', { plan: true, unlinked: true }],
    ['GLOBAL plan', { plan: true, scope: AiConversationScope.GLOBAL }],
  ])('allows %s and preserves output', async (_name, options) => {
    const f = setup(options);
    const result = await f.handler.execute(f.command);
    expect(result.status).toBe(AiGenerationStatus.DISCARDED);
    expect(result.output_data).toEqual(privateOutput);
    expect(f.generation.getOutputData()).toEqual(privateOutput);
    expect(f.save).toHaveBeenCalledWith(f.generation, context);
    if (!options.unlinked)
      expect(f.findConversation).toHaveBeenCalledWith(
        'conversation-1',
        'user-1',
        context,
      );
    if (
      ((options.scope ?? AiConversationScope.PAGE) ===
        AiConversationScope.PAGE &&
        !options.unlinked) ||
      options.plan
    )
      expect(f.findPage).toHaveBeenCalledWith('page-1', context);
  });

  it.each<[string, Options]>([
    ['revoked PAGE_READ', { pageAllowed: false }],
    ['foreign generation owner', { generationOwner: 'other-user' }],
    ['foreign conversation owner', { conversationOwner: 'other-user' }],
    ['missing conversation', { missingConversation: true }],
    [
      'conversation workspace mismatch',
      { conversationWorkspace: 'other-workspace' },
    ],
    ['deleted page', { deletedPage: true }],
    ['missing page', { missingPage: true }],
    ['page workspace mismatch', { pageWorkspace: 'other-workspace' }],
    [
      'GLOBAL workspace denied',
      { scope: AiConversationScope.GLOBAL, workspaceAllowed: false },
    ],
    ['unlinked workspace denied', { unlinked: true, workspaceAllowed: false }],
    ['invalid token', { tokenOnly: true, token: 'invalid' }],
    ['expired token', { tokenOnly: true, token: 'expired' }],
    ['wrong page token', { tokenOnly: true, token: 'valid-page-2' }],
    ['absent token', { tokenOnly: true }],
    ['PAGE scope without page id', { missingPageScope: true }],
    ['plan target mismatch', { plan: true, input: { pageId: 'page-2' } }],
    ['unlinked plan missing target', { unlinked: true, plan: true, input: {} }],
    ['unlinked plan invalid input', { unlinked: true, plan: true, input: [] }],
    [
      'unlinked plan blank target',
      { unlinked: true, plan: true, input: { pageId: ' ' } },
    ],
    [
      'unlinked plan page denied',
      { unlinked: true, plan: true, pageAllowed: false },
    ],
    [
      'unlinked plan workspace mismatch',
      { unlinked: true, plan: true, pageWorkspace: 'other' },
    ],
    ['PROCESSING', { status: AiGenerationStatus.PROCESSING }],
    ['APPLIED', { status: AiGenerationStatus.APPLIED }],
    ['DISCARDED', { status: AiGenerationStatus.DISCARDED }],
  ])('rejects %s before mutation or serialization', async (_name, options) => {
    const f = setup(options);
    const serialize = jest.spyOn(AiGenerationResponseDto, 'fromDomain');
    const discard = jest.spyOn(f.generation, 'discard');
    await expect(f.handler.execute(f.command)).rejects.toThrow();
    expect(f.save).not.toHaveBeenCalled();
    expect(serialize).not.toHaveBeenCalled();
    expect(f.generation.getStatus()).toBe(
      options.status ?? AiGenerationStatus.COMPLETED,
    );
    if (!options.status) expect(discard).not.toHaveBeenCalled();
  });

  it('propagates access errors without mutation and reuses explicit context', async () => {
    const f = setup();
    f.authorize.mockRejectedValue(new Error('policy unavailable'));
    await expect(f.handler.execute(f.command, context)).rejects.toThrow(
      'policy unavailable',
    );
    expect(f.runInTransaction).not.toHaveBeenCalled();
    expect(f.save).not.toHaveBeenCalled();
    expect(f.generation.getStatus()).toBe(AiGenerationStatus.COMPLETED);
    expect(f.findPage).toHaveBeenCalledWith('page-1', context);
  });

  it('authorizes only after obtaining the generation row lock', async () => {
    const f = setup();
    await f.handler.execute(f.command);
    expect(f.findGeneration.mock.invocationCallOrder[0]).toBeLessThan(
      f.findConversation.mock.invocationCallOrder[0],
    );
    expect(f.authorize.mock.invocationCallOrder[0]).toBeLessThan(
      f.save.mock.invocationCallOrder[0],
    );
  });
});
