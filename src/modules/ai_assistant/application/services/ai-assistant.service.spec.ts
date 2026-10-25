import {
  BadGatewayException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import type { AuthorizationService } from 'src/modules/permission/application/services/authorization.service';
import type { PageRepository } from 'src/modules/content/domain/repositories/page.repository';
import type { UnitOfWork } from 'src/shared/infrastructure/persistence/unit-of-work.interface';
import { AiConversation } from '../../domain/aggregates/ai-conversation/ai-conversation.aggregate';
import { AiGeneration } from '../../domain/aggregates/ai-generation/ai-generation.aggregate';
import type { AiMessage } from '../../domain/entities/ai-message.entity';
import type { AiUsage } from '../../domain/entities/ai-usage.entity';
import { AiGenerationStatus } from '../../domain/enums/ai-generation-status.enum';
import { AiConversationScope } from '../../domain/enums/ai-conversation-scope.enum';
import { AiConversationStatus } from '../../domain/enums/ai-conversation-status.enum';
import { AiMessageRole } from '../../domain/enums/ai-message-role.enum';
import type { AiConversationRepository } from '../../domain/repositories/ai-conversation.repository';
import type { AiGenerationRepository } from '../../domain/repositories/ai-generation.repository';
import type { AiMessageRepository } from '../../domain/repositories/ai-message.repository';
import type { AiUsageRepository } from '../../domain/repositories/ai-usage.repository';
import { AI_MODIFICATION_PLAN_CAPABILITY } from '../constants/ai-modification-plan.constant';
import { PAGE_COMPOSITION_CAPABILITY } from '../constants/page-composition.constant';
import type { AiRuntimePort } from '../ports/ai-runtime.port';
import { PAGE_COMPOSITION_SCHEMA_VERSION } from '../types/page-composition-draft';
import { AiAssistantService } from './ai-assistant.service';
import { AiConversationAccessService } from './ai-conversation-access.service';
import { PageCompositionDraftValidator } from './page-composition-draft-validator.service';

const request = {
  requestId: 'request-1',
  userId: 'user-1',
  conversationId: 'conversation-1',
  capability: 'CHAT',
  content: 'Hello',
  input: {
    message: 'Hello',
  },
};

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}

function createFixture(runtimeExecute: jest.Mock) {
  const clone = (item: AiGeneration) =>
    AiGeneration.create({
      id: item.getId(),
      conversationId: item.getConversationId(),
      userId: item.getUserId(),
      workspaceId: item.getWorkspaceId(),
      capability: item.getCapability(),
      status: item.getStatus(),
      inputData: item.getInputData(),
      outputData: item.getOutputData(),
      provider: item.getProvider(),
      model: item.getModel(),
      errorCode: item.getErrorCode(),
      errorMessage: item.getErrorMessage(),
      createdAt: item.getCreatedAt(),
      updatedAt: item.getUpdatedAt(),
      appliedAt: item.getAppliedAt(),
    });
  const conversation = AiConversation.create({
    id: 'conversation-1',
    userId: 'user-1',
    workspaceId: 'workspace-1',
  });
  let generation: AiGeneration | undefined;
  const savedMessageRoles: AiMessageRole[] = [];
  const committedUsage: AiUsage[] = [];
  const findConversation = jest.fn().mockResolvedValue(conversation);
  const saveMessage = jest.fn((message: AiMessage) => {
    savedMessageRoles.push(message.getRole());
    return Promise.resolve(message);
  });
  const saveGeneration = jest.fn((item: AiGeneration) => {
    generation = clone(item);
    return Promise.resolve(item);
  });
  const findGeneration = jest.fn(() =>
    Promise.resolve(generation ? clone(generation) : null),
  );
  const saveUsage = jest.fn((usage: AiUsage) => {
    committedUsage.push(usage);
    return Promise.resolve(usage);
  });
  const findPage = jest.fn();
  const authorize = jest.fn().mockResolvedValue(true);
  const lock = jest.fn().mockResolvedValue(undefined);
  const runInTransaction = jest.fn(
    async (callback: (context: unknown) => Promise<unknown>) => {
      const before = generation ? clone(generation) : undefined;
      const roles = [...savedMessageRoles];
      const usage = [...committedUsage];
      try {
        return await callback({});
      } catch (error) {
        generation = before;
        savedMessageRoles.splice(0, savedMessageRoles.length, ...roles);
        committedUsage.splice(0, committedUsage.length, ...usage);
        throw error;
      }
    },
  );
  const service = new AiAssistantService(
    {
      findByIdAndUserId: findConversation,
    } as unknown as AiConversationRepository,
    {
      save: saveMessage,
    } as unknown as AiMessageRepository,
    {
      save: saveGeneration,
      findByIdAndUserId: findGeneration,
      findByIdAndUserIdForUpdate: findGeneration,
    } as unknown as AiGenerationRepository,
    {
      save: saveUsage,
    } as unknown as AiUsageRepository,
    {
      execute: runtimeExecute,
    } as AiRuntimePort,
    {
      runInTransaction,
    } as unknown as UnitOfWork,
    new AiConversationAccessService(
      { findById: findPage } as unknown as PageRepository,
      { authorize } as unknown as AuthorizationService,
    ),
    new PageCompositionDraftValidator(),
    { lock },
  );
  return {
    service,
    lock,
    committedUsage,
    findPage,
    authorize,
    getGeneration: () => generation,
    findConversation,
    findGeneration,
    saveMessage,
    savedMessageRoles,
    saveGeneration,
    saveUsage,
    runInTransaction,
  };
}

describe('AiAssistantService', () => {
  it('models a revoker waiting until the short completion transaction commits', async () => {
    const committed = deferred<void>();
    let allowed = true;
    let held = false;
    let writer: Promise<void> | undefined;
    const f = createFixture(
      jest.fn(() => {
        expect(held).toBe(false);
        return Promise.resolve({ output: 'authorized output' });
      }),
    );
    const transaction = f.runInTransaction.getMockImplementation()!;
    let transactions = 0;
    f.runInTransaction.mockImplementation(async (callback) => {
      const completion = ++transactions === 2;
      try {
        return await transaction(callback);
      } finally {
        if (completion) {
          held = false;
          committed.resolve();
        }
      }
    });
    f.lock.mockImplementation(() => {
      held = true;
      return Promise.resolve();
    });
    f.authorize.mockImplementation(() => {
      if (held) {
        writer = committed.promise.then(() => {
          allowed = false;
        });
        expect(f.getGeneration()?.getStatus()).toBe(
          AiGenerationStatus.PROCESSING,
        );
      }
      return Promise.resolve(allowed);
    });
    const response = await f.service.submit(request);
    await writer;
    expect(response.status).toBe(AiGenerationStatus.COMPLETED);
    expect(allowed).toBe(false);
    expect(f.savedMessageRoles).toEqual([
      AiMessageRole.USER,
      AiMessageRole.ASSISTANT,
    ]);
    // This models the orchestration contract; real PostgreSQL blocking is not tested here.
  });

  it('does not duplicate output when an overlapping operation completed the locked generation', async () => {
    const runtime = deferred<{ output: string }>();
    const started = deferred<void>();
    const f = createFixture(
      jest.fn(() => {
        started.resolve();
        return runtime.promise;
      }),
    );
    const submitted = f.service.submit(request);
    const outcome = expect(submitted).rejects.toBeInstanceOf(ConflictException);
    await started.promise;
    f.getGeneration()!.complete({ outputData: 'winner output' });
    f.savedMessageRoles.push(AiMessageRole.ASSISTANT);
    runtime.resolve({ output: 'loser output' });
    await outcome;
    expect(f.getGeneration()?.getOutputData()).toBe('winner output');
    expect(
      f.savedMessageRoles.filter((role) => role === AiMessageRole.ASSISTANT),
    ).toHaveLength(1);
    expect(f.saveGeneration).toHaveBeenCalledTimes(1);
  });

  it.each([
    'writing.improve',
    'writing.translate',
    'writing.shorten',
    'writing.expand',
    'writing.summarize',
    'writing.continue',
  ])(
    'rechecks workspace authorization and preserves metadata for %s',
    async (capability) => {
      const f = createFixture(
        jest.fn().mockResolvedValue({
          output: { text: 'safe' },
          provider: 'p',
          model: 'm',
        }),
      );
      const result = await f.service.submit({ ...request, capability });
      expect(result).toMatchObject({ status: 'COMPLETED', capability });
      expect(f.authorize).toHaveBeenCalledTimes(2);
      expect(f.saveMessage.mock.calls[1][0].getMetadata()).toEqual({
        requestId: request.requestId,
        generationId: result.id,
        capability,
        provider: 'p',
        model: 'm',
      });
    },
  );

  it('preserves direct PAGE_READ when a supplied share token expires during runtime', async () => {
    let tokenValid = true;
    const f = createFixture(
      jest.fn().mockImplementation(() => {
        tokenValid = false;
        return Promise.resolve({ output: 'safe' });
      }),
    );
    f.findConversation.mockResolvedValue(
      AiConversation.create({
        id: request.conversationId,
        userId: request.userId,
        workspaceId: 'workspace-1',
        scope: AiConversationScope.PAGE,
        pageId: 'page-1',
      }),
    );
    f.findPage.mockResolvedValue({
      getId: () => 'page-1',
      getWorkspaceId: () => 'workspace-1',
      getDeletedAt: () => null,
    });
    const directAllowed = true;
    f.authorize.mockImplementation(({ shareToken }) =>
      Promise.resolve(directAllowed || (shareToken === 'token' && tokenValid)),
    );
    await expect(
      f.service.submit({ ...request, shareToken: 'token' }),
    ).resolves.toMatchObject({ status: 'COMPLETED' });
    expect(f.authorize).toHaveBeenCalledTimes(2);
    expect(tokenValid).toBe(false);
  });

  it.each(['assistant', 'usage', 'generation'])(
    'rolls back completion writes when saving %s fails',
    async (target) => {
      const f = createFixture(
        jest.fn().mockResolvedValue({
          output: 'PROTECTED_OUTPUT',
          provider: 'p',
          model: 'm',
          usage: { promptTokens: 1, completionTokens: 2, totalTokens: 3 },
        }),
      );
      const failure = new Error('persistence failed');
      if (target === 'assistant')
        f.saveMessage
          .mockImplementationOnce(f.saveMessage.getMockImplementation()!)
          .mockRejectedValueOnce(failure);
      if (target === 'usage') f.saveUsage.mockRejectedValueOnce(failure);
      if (target === 'generation') {
        const original = f.saveGeneration.getMockImplementation()!;
        f.saveGeneration
          .mockImplementationOnce(original)
          .mockRejectedValueOnce(failure);
      }
      await expect(f.service.submit(request)).rejects.toBe(failure);
      expect(f.getGeneration()?.getStatus()).toBe(AiGenerationStatus.FAILED);
      expect(f.getGeneration()?.getOutputData()).toBeNull();
      expect(f.getGeneration()?.getErrorCode()).toBe('AI_COMPLETION_ERROR');
      expect(f.savedMessageRoles).not.toContain(AiMessageRole.ASSISTANT);
      expect(f.committedUsage).toEqual([]);
    },
  );

  it('rolls back assistant output when usage is missing provider/model', async () => {
    const f = createFixture(
      jest.fn().mockResolvedValue({
        output: 'protected',
        usage: { promptTokens: 1, completionTokens: 1, totalTokens: 2 },
      }),
    );
    await expect(f.service.submit(request)).rejects.toBeInstanceOf(
      BadGatewayException,
    );
    expect(f.getGeneration()?.getOutputData()).toBeNull();
    expect(f.savedMessageRoles).toEqual([AiMessageRole.USER]);
    expect(f.committedUsage).toEqual([]);
  });

  it('preserves authorization service failure and stores only a constant cleanup message', async () => {
    const failure = new ServiceUnavailableException(
      'authorization unavailable',
    );
    const f = createFixture(
      jest.fn().mockResolvedValue({ output: 'PROTECTED_OUTPUT' }),
    );
    f.authorize.mockResolvedValueOnce(true).mockRejectedValueOnce(failure);
    await expect(f.service.submit(request)).rejects.toBe(failure);
    expect(f.getGeneration()?.getErrorCode()).toBe('AI_ACCESS_REVOKED');
    expect(f.getGeneration()?.getErrorMessage()).toBe(
      'AI completion access is no longer available',
    );
    expect(f.getGeneration()?.getOutputData()).toBeNull();
  });

  it.each([
    AiGenerationStatus.FAILED,
    AiGenerationStatus.COMPLETED,
    AiGenerationStatus.APPLIED,
    AiGenerationStatus.DISCARDED,
  ])('does not complete or fail a generation already %s', async (status) => {
    const f = createFixture(
      jest.fn().mockImplementation(() => {
        const generation = f.getGeneration()!;
        if (status === AiGenerationStatus.FAILED)
          generation.fail('OTHER', 'Other failure');
        else {
          generation.complete({ outputData: 'prior output' });
          if (status === AiGenerationStatus.APPLIED) generation.apply();
          if (status === AiGenerationStatus.DISCARDED) generation.discard();
        }
        return Promise.resolve({ output: 'PROTECTED_OUTPUT' });
      }),
    );
    await expect(f.service.submit(request)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(f.getGeneration()?.getStatus()).toBe(status);
    expect(f.savedMessageRoles).toEqual([AiMessageRole.USER]);
    expect(f.saveGeneration).toHaveBeenCalledTimes(1);
  });

  it.each(['owner', 'linkage', 'workspace'])(
    'rejects a generation with changed %s',
    async (kind) => {
      const f = createFixture(
        jest.fn().mockImplementation(() => {
          f.findGeneration.mockResolvedValue(
            AiGeneration.create({
              id: f.getGeneration()!.getId(),
              userId: kind === 'owner' ? 'other' : request.userId,
              conversationId:
                kind === 'linkage' ? 'other' : request.conversationId,
              workspaceId: kind === 'workspace' ? 'other' : 'workspace-1',
              capability: 'CHAT',
            }),
          );
          return Promise.resolve({ output: 'protected' });
        }),
      );
      await expect(f.service.submit(request)).rejects.toBeInstanceOf(
        kind === 'owner' ? NotFoundException : ForbiddenException,
      );
      expect(f.savedMessageRoles).toEqual([AiMessageRole.USER]);
      expect(f.saveUsage).not.toHaveBeenCalled();
    },
  );

  it('waits for completion locks then sees a revoke committed before lock acquisition', async () => {
    const acquired = deferred<void>();
    const waiting = deferred<void>();
    const f = createFixture(
      jest.fn().mockResolvedValue({ output: 'protected' }),
    );
    f.lock.mockImplementation(() => {
      waiting.resolve();
      return acquired.promise;
    });
    const submitted = f.service.submit(request);
    const outcome =
      expect(submitted).rejects.toBeInstanceOf(ForbiddenException);
    await waiting.promise;
    expect(f.authorize).toHaveBeenCalledTimes(1);
    f.authorize.mockResolvedValue(false);
    acquired.resolve();
    await outcome;
    expect(f.savedMessageRoles).toEqual([AiMessageRole.USER]);
    expect(f.getGeneration()?.getStatus()).toBe(AiGenerationStatus.FAILED);
  });

  it('rejects scope changed while waiting for the Conversation lock', async () => {
    const f = createFixture(
      jest.fn().mockResolvedValue({ output: 'protected' }),
    );
    f.lock.mockImplementation(() => {
      f.findConversation.mockResolvedValue(
        AiConversation.create({
          id: request.conversationId,
          userId: request.userId,
          workspaceId: 'other',
        }),
      );
      return Promise.resolve();
    });
    await expect(f.service.submit(request)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(f.savedMessageRoles).toEqual([AiMessageRole.USER]);
  });

  it.each([
    'PAGE_READ revoked',
    'share token revoked',
    'share token expired',
    'page soft deleted',
    'page missing',
    'conversation missing',
    'owner changed',
    'workspace changed',
    'page changed',
    'scope changed',
    'GLOBAL WORKSPACE_READ revoked',
  ])('fails closed after runtime when %s', async (change) => {
    let finish!: (value: unknown) => void;
    let markStarted!: () => void;
    const started = new Promise<void>((resolve) => {
      markStarted = resolve;
    });
    const pending = new Promise((resolve) => {
      finish = resolve;
    });
    const fixture = createFixture(
      jest.fn(() => {
        markStarted();
        return pending;
      }),
    );
    const global = change.startsWith('GLOBAL');
    const conversation = (overrides = {}) =>
      AiConversation.create({
        id: request.conversationId,
        userId: request.userId,
        workspaceId: 'workspace-1',
        scope: global ? AiConversationScope.GLOBAL : AiConversationScope.PAGE,
        pageId: global ? null : 'page-1',
        ...overrides,
      });
    fixture.findConversation.mockResolvedValue(conversation());
    fixture.findPage.mockResolvedValue({
      getId: () => 'page-1',
      getWorkspaceId: () => 'workspace-1',
      getDeletedAt: () => null,
    });
    const submitted = fixture.service.submit({
      ...request,
      shareToken: 'token',
    });
    await started;
    expect(fixture.savedMessageRoles).toEqual([AiMessageRole.USER]);
    expect(fixture.getGeneration()?.getStatus()).toBe(
      AiGenerationStatus.PROCESSING,
    );
    if (change.includes('revoked') || change.includes('expired'))
      fixture.authorize.mockResolvedValue(false);
    if (change === 'page soft deleted')
      fixture.findPage.mockResolvedValue({ getDeletedAt: () => new Date() });
    if (change === 'page missing') fixture.findPage.mockResolvedValue(null);
    if (change === 'conversation missing')
      fixture.findConversation.mockResolvedValue(null);
    if (change === 'owner changed')
      fixture.findConversation.mockResolvedValue(
        conversation({ userId: 'other' }),
      );
    if (change === 'workspace changed')
      fixture.findConversation.mockResolvedValue(
        conversation({ workspaceId: 'other' }),
      );
    if (change === 'page changed')
      fixture.findConversation.mockResolvedValue(
        conversation({ pageId: 'other' }),
      );
    if (change === 'scope changed')
      fixture.findConversation.mockResolvedValue(
        conversation({ scope: AiConversationScope.GLOBAL, pageId: null }),
      );
    const outcome = submitted.then(
      (value) => ({ value, error: null }),
      (error: unknown) => ({ value: null, error }),
    );
    finish({
      output: { text: 'PROTECTED_OUTPUT' },
      provider: 'test',
      model: 'test',
      usage: { promptTokens: 1, completionTokens: 2, totalTokens: 3 },
    });
    const result = await outcome;
    expect(result.value).toBeNull();
    expect(result.error).toBeInstanceOf(
      change.includes('missing') ||
        change.includes('deleted') ||
        change === 'owner changed'
        ? NotFoundException
        : ForbiddenException,
    );
    expect(String(result.error)).not.toContain('PROTECTED_OUTPUT');
    expect(fixture.savedMessageRoles).toEqual([AiMessageRole.USER]);
    expect(fixture.saveUsage).not.toHaveBeenCalled();
    expect(fixture.getGeneration()?.getStatus()).toBe(
      AiGenerationStatus.FAILED,
    );
    expect(fixture.getGeneration()?.getOutputData()).toBeNull();
    expect(fixture.getGeneration()?.getErrorCode()).toBe('AI_ACCESS_REVOKED');
    expect(fixture.getGeneration()?.getErrorMessage()).not.toContain(
      'PROTECTED_OUTPUT',
    );
  });

  it('links assistant history metadata to the completed generation for reload', async () => {
    const fixture = createFixture(
      jest.fn().mockResolvedValue({
        output: { text: 'Taskmanly helps teams.' },
        provider: 'ollama',
        model: 'qwen',
      }),
    );
    const generation = await fixture.service.submit({
      ...request,
      capability: 'writing.improve',
    });
    const assistantMessage = fixture.saveMessage.mock.calls
      .map(([message]) => message)
      .find((message) => message.getRole() === AiMessageRole.ASSISTANT);
    expect(assistantMessage?.getMetadata()).toEqual(
      expect.objectContaining({
        requestId: request.requestId,
        generationId: generation.id,
        capability: 'writing.improve',
      }),
    );
  });

  it.each(['success', 'failure'])(
    'does not recreate history when a running request finishes with %s after deletion',
    async (outcome) => {
      let finish!: (value: unknown) => void;
      let fail!: (error: Error) => void;
      const runtimeResult = new Promise((resolve, reject) => {
        finish = resolve;
        fail = reject;
      });
      let markStarted!: () => void;
      const started = new Promise<void>((resolve) => {
        markStarted = resolve;
      });
      const fixture = createFixture(
        jest.fn(() => {
          markStarted();
          return runtimeResult;
        }),
      );
      fixture.findConversation.mockResolvedValue(
        AiConversation.create({
          id: 'conversation-1',
          userId: 'user-1',
          workspaceId: 'workspace-1',
          scope: AiConversationScope.PAGE,
          pageId: 'page-1',
        }),
      );
      fixture.findPage.mockResolvedValue({
        getId: () => 'page-1',
        getWorkspaceId: () => 'workspace-1',
        getDeletedAt: () => null,
      });
      const submitted = fixture.service.submit(request);
      await started;
      // The Page -> Conversation -> Generation FK cascade has removed the row.
      fixture.findGeneration.mockResolvedValue(null);
      const result = expect(submitted).rejects;
      if (outcome === 'success') {
        finish({
          output: { text: 'Late answer' },
          provider: 'ollama',
          model: 'test',
          usage: { promptTokens: 1, completionTokens: 1, totalTokens: 2 },
        });
        await result.toBeInstanceOf(NotFoundException);
      } else {
        fail(new Error('Runtime failed after Page deletion'));
        await result.toThrow('Runtime failed after Page deletion');
      }
      expect(fixture.saveGeneration).toHaveBeenCalledTimes(1);
      expect(fixture.savedMessageRoles).toEqual([AiMessageRole.USER]);
      expect(fixture.saveUsage).not.toHaveBeenCalled();
    },
  );

  it('allows PAGE writing using page permission and preserves its resolved workspace', async () => {
    const runtime = jest.fn().mockResolvedValue({ output: { text: 'Hi' } });
    const fixture = createFixture(runtime);
    fixture.findConversation.mockResolvedValue(
      AiConversation.create({
        id: 'conversation-1',
        userId: 'user-1',
        workspaceId: 'workspace-1',
        scope: AiConversationScope.PAGE,
        pageId: 'page-1',
      }),
    );
    fixture.findPage.mockResolvedValue({
      getId: () => 'page-1',
      getWorkspaceId: () => 'workspace-1',
      getDeletedAt: () => null,
    });
    fixture.authorize.mockImplementation(
      ({
        target,
        shareToken,
      }: {
        target: { type: string };
        shareToken?: string;
      }) => Promise.resolve(target.type === 'page' && shareToken === 'token'),
    );
    const result = await fixture.service.submit({
      ...request,
      shareToken: 'token',
    });
    expect(result.workspace_id).toBe('workspace-1');
    expect(runtime).toHaveBeenCalledTimes(1);
    expect(fixture.authorize).toHaveBeenCalledTimes(2);
  });

  it('rejects PAGE submit after access is revoked before persistence or runtime', async () => {
    const runtime = jest.fn();
    const fixture = createFixture(runtime);
    fixture.findConversation.mockResolvedValue(
      AiConversation.create({
        id: 'conversation-1',
        userId: 'user-1',
        workspaceId: 'workspace-1',
        scope: AiConversationScope.PAGE,
        pageId: 'page-1',
      }),
    );
    fixture.findPage.mockResolvedValue({
      getId: () => 'page-1',
      getWorkspaceId: () => 'workspace-1',
      getDeletedAt: () => null,
    });
    fixture.authorize.mockResolvedValue(false);
    await expect(fixture.service.submit(request)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(fixture.runInTransaction).not.toHaveBeenCalled();
    expect(runtime).not.toHaveBeenCalled();
  });

  it('keeps existing LEGACY conversations usable by their owner', async () => {
    const fixture = createFixture(
      jest.fn().mockResolvedValue({ output: { text: 'Hi' } }),
    );
    fixture.findConversation.mockResolvedValue(
      AiConversation.restore({
        id: 'conversation-1',
        userId: 'user-1',
        workspaceId: null,
        title: null,
        status: AiConversationStatus.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    );
    await expect(fixture.service.submit(request)).resolves.toMatchObject({
      status: 'COMPLETED',
      workspace_id: null,
    });
    expect(fixture.authorize).not.toHaveBeenCalled();
  });

  it('rejects page modification planning through generic submit before persistence or runtime', async () => {
    const runtimeExecute = jest.fn();
    const fixture = createFixture(runtimeExecute);
    await expect(
      fixture.service.submit({
        ...request,
        capability: AI_MODIFICATION_PLAN_CAPABILITY,
        content: 'Add a release checklist',
        input: {
          message: 'Add a release checklist',
        },
        context: {
          page: {
            id: 'client-supplied-page',
          },
        },
      }),
    ).rejects.toThrow(
      'Page modification planning must use the dedicated page endpoint',
    );
    expect(fixture.findConversation).not.toHaveBeenCalled();
    expect(fixture.runInTransaction).not.toHaveBeenCalled();
    expect(fixture.saveMessage).not.toHaveBeenCalled();
    expect(fixture.saveGeneration).not.toHaveBeenCalled();
    expect(runtimeExecute).not.toHaveBeenCalled();
  });

  it.each(['qwen3:1.7b', 'qwen3:4b-instruct'])(
    'persists request, completes generation, response, and usage for %s',
    async (model) => {
      const runtimeExecute = jest.fn().mockResolvedValue({
        output: {
          text: 'Hi',
        },
        provider: 'ollama',
        model,
        usage: {
          promptTokens: 314,
          completionTokens: 38,
          totalTokens: 352,
        },
      });
      const fixture = createFixture(runtimeExecute);
      const result = await fixture.service.submit(request);
      expect(runtimeExecute).toHaveBeenCalledWith({
        requestId: 'request-1',
        capability: 'CHAT',
        content: 'Hello',
        input: {
          message: 'Hello',
        },
        context: undefined,
      });
      expect(fixture.runInTransaction).toHaveBeenCalledTimes(2);
      expect(fixture.saveMessage).toHaveBeenCalledTimes(2);
      expect(fixture.savedMessageRoles).toEqual([
        AiMessageRole.USER,
        AiMessageRole.ASSISTANT,
      ]);
      expect(fixture.saveUsage).toHaveBeenCalledTimes(1);
      const savedUsage = fixture.saveUsage.mock.calls[0][0];
      expect(savedUsage.getPromptTokens()).toBe(314);
      expect(savedUsage.getCompletionTokens()).toBe(38);
      expect(savedUsage.getTotalTokens()).toBe(352);
      expect(savedUsage.getProvider()).toBe('ollama');
      expect(savedUsage.getModel()).toBe(model);
      expect(savedUsage.getGenerationId()).toBe(
        fixture.getGeneration()?.getId(),
      );
      expect(savedUsage.getUserId()).toBe(request.userId);
      expect(savedUsage.getEstimatedCost()).toBeNull();
      expect(savedUsage.getCurrency()).toBeNull();
      expect(result.status).toBe(AiGenerationStatus.COMPLETED);
    },
  );

  it('completes generation and saves the assistant response without usage', async () => {
    const fixture = createFixture(
      jest.fn().mockResolvedValue({
        output: {
          text: 'Hi',
        },
        provider: 'ollama',
        model: 'qwen3:1.7b',
      }),
    );
    const result = await fixture.service.submit(request);
    expect(result.status).toBe(AiGenerationStatus.COMPLETED);
    expect(fixture.getGeneration()?.getStatus()).toBe(
      AiGenerationStatus.COMPLETED,
    );
    expect(fixture.runInTransaction).toHaveBeenCalledTimes(2);
    expect(fixture.savedMessageRoles).toEqual([
      AiMessageRole.USER,
      AiMessageRole.ASSISTANT,
    ]);
    expect(fixture.saveMessage.mock.calls[1][0].getContent()).toBe('Hi');
    expect(fixture.saveUsage).not.toHaveBeenCalled();
  });

  it('does not fail a generation that already left PROCESSING', async () => {
    const runtimeExecute = jest.fn().mockResolvedValue({
      output: {
        text: 'Hi',
      },
      provider: 'TEST',
      model: 'test-model',
    });
    const fixture = createFixture(runtimeExecute);
    fixture.runInTransaction.mockImplementationOnce(
      async (callback: (context: unknown) => Promise<unknown>) =>
        await callback({}),
    );
    fixture.runInTransaction.mockImplementationOnce(() => {
      fixture.getGeneration()?.complete({
        outputData: {
          text: 'Hi',
        },
      });
      return Promise.reject(new Error('persist failed after complete'));
    });
    await expect(fixture.service.submit(request)).rejects.toThrow(
      'persist failed after complete',
    );
    expect(fixture.getGeneration()?.getStatus()).toBe(
      AiGenerationStatus.COMPLETED,
    );
    expect(fixture.savedMessageRoles).toEqual([AiMessageRole.USER]);
  });

  it('marks the generation failed without creating an assistant response', async () => {
    const runtimeExecute = jest
      .fn()
      .mockRejectedValue(new ServiceUnavailableException('Unavailable'));
    const fixture = createFixture(runtimeExecute);
    await expect(fixture.service.submit(request)).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
    expect(fixture.runInTransaction).toHaveBeenCalledTimes(2);
    expect(fixture.saveMessage).toHaveBeenCalledTimes(1);
    expect(fixture.saveUsage).not.toHaveBeenCalled();
    expect(fixture.getGeneration()?.getStatus()).toBe(
      AiGenerationStatus.FAILED,
    );
  });

  it('validates and persists a valid page composition draft', async () => {
    const draft = {
      schemaVersion: PAGE_COMPOSITION_SCHEMA_VERSION,
      type: 'PAGE_COMPOSITION',
      page: {
        title: 'Sprint Planning',
      },
      blocks: [],
      databases: [],
    };
    const runtimeExecute = jest.fn().mockResolvedValue({
      output: draft,
      provider: 'ollama',
      model: 'qwen3:4b-instruct',
      usage: {
        promptTokens: 1677,
        completionTokens: 528,
        totalTokens: 2205,
      },
    });
    const fixture = createFixture(runtimeExecute);
    const result = await fixture.service.submit({
      ...request,
      capability: PAGE_COMPOSITION_CAPABILITY,
      content: 'Create a sprint planning page',
      input: {
        message: 'Create a sprint planning page',
      },
    });
    expect(runtimeExecute).toHaveBeenCalledWith({
      requestId: 'request-1',
      capability: PAGE_COMPOSITION_CAPABILITY,
      content: 'Create a sprint planning page',
      input: {
        message: 'Create a sprint planning page',
      },
      context: undefined,
    });
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
    expect(fixture.getGeneration()?.getOutputData()).toEqual(draft);
    expect(fixture.saveUsage).toHaveBeenCalledTimes(1);
    const savedUsage = fixture.saveUsage.mock.calls[0][0];
    expect(savedUsage.getPromptTokens()).toBe(1677);
    expect(savedUsage.getCompletionTokens()).toBe(528);
    expect(savedUsage.getTotalTokens()).toBe(2205);
    expect(savedUsage.getProvider()).toBe('ollama');
    expect(savedUsage.getModel()).toBe('qwen3:4b-instruct');
    expect(savedUsage.getGenerationId()).toBe(fixture.getGeneration()?.getId());
    expect(savedUsage.getUserId()).toBe(request.userId);
    expect(fixture.savedMessageRoles).toEqual([
      AiMessageRole.USER,
      AiMessageRole.ASSISTANT,
    ]);
    // History shows a summary; the draft JSON stays in output_data only.
    expect(fixture.saveMessage.mock.calls[1][0].getContent()).toBe(
      'Đã tạo bản nháp trang "Sprint Planning". Trang chỉ được tạo sau khi bạn xác nhận.',
    );
  });

  it('fails the generation when page composition draft validation fails', async () => {
    const runtimeExecute = jest.fn().mockResolvedValue({
      output: {
        text: 'This is not a page composition draft',
      },
      provider: 'ollama',
      model: 'qwen3:4b-instruct',
    });
    const fixture = createFixture(runtimeExecute);
    await expect(
      fixture.service.submit({
        ...request,
        capability: PAGE_COMPOSITION_CAPABILITY,
        content: 'Create a sprint planning page',
        input: {
          message: 'Create a sprint planning page',
        },
      }),
    ).rejects.toThrow('AI returned an invalid page composition draft');
    expect(fixture.getGeneration()?.getStatus()).toBe(
      AiGenerationStatus.FAILED,
    );
    expect(fixture.savedMessageRoles).toEqual([AiMessageRole.USER]);
    expect(fixture.saveUsage).not.toHaveBeenCalled();
  });
});
