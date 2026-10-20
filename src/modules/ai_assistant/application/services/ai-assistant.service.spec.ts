import {
  ForbiddenException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import type { AuthorizationService } from 'src/modules/permission/application/services/authorization.service';
import type { PageRepository } from 'src/modules/content/domain/repositories/page.repository';
import type { UnitOfWork } from 'src/shared/infrastructure/persistence/unit-of-work.interface';
import { AiConversation } from '../../domain/aggregates/ai-conversation/ai-conversation.aggregate';
import type { AiGeneration } from '../../domain/aggregates/ai-generation/ai-generation.aggregate';
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

function createFixture(runtimeExecute: jest.Mock) {
  const conversation = AiConversation.create({
    id: 'conversation-1',
    userId: 'user-1',
    workspaceId: 'workspace-1',
  });
  let generation: AiGeneration | undefined;
  const savedMessageRoles: AiMessageRole[] = [];
  const findConversation = jest.fn().mockResolvedValue(conversation);
  const saveMessage = jest.fn((message: AiMessage) => {
    savedMessageRoles.push(message.getRole());
    return Promise.resolve(message);
  });
  const saveGeneration = jest.fn((item: AiGeneration) => {
    generation = item;
    return Promise.resolve(item);
  });
  const findGeneration = jest.fn(() => Promise.resolve(generation ?? null));
  const saveUsage = jest.fn((usage: AiUsage) => Promise.resolve(usage));
  const findPage = jest.fn();
  const authorize = jest.fn().mockResolvedValue(true);
  const runInTransaction = jest.fn(
    async (callback: (context: unknown) => Promise<unknown>) =>
      await callback({}),
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
  );
  return {
    service,
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
      async ({ target, shareToken }) =>
        target.type === 'page' && shareToken === 'token',
    );
    const result = await fixture.service.submit({
      ...request,
      shareToken: 'token',
    });
    expect(result.workspace_id).toBe('workspace-1');
    expect(runtime).toHaveBeenCalledTimes(1);
    expect(fixture.authorize).toHaveBeenCalledTimes(1);
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
