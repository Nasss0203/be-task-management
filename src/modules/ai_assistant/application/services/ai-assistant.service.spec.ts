import { ServiceUnavailableException } from '@nestjs/common';
import type { AuthorizationService } from 'src/modules/permission/application/services/authorization.service';
import type { UnitOfWork } from 'src/shared/infrastructure/persistence/unit-of-work.interface';
import { AiConversation } from '../../domain/aggregates/ai-conversation/ai-conversation.aggregate';
import type { AiGeneration } from '../../domain/aggregates/ai-generation/ai-generation.aggregate';
import type { AiMessage } from '../../domain/entities/ai-message.entity';
import type { AiUsage } from '../../domain/entities/ai-usage.entity';
import { AiMessageRole } from '../../domain/enums/ai-message-role.enum';
import { AiGenerationStatus } from '../../domain/enums/ai-generation-status.enum';
import type { AiConversationRepository } from '../../domain/repositories/ai-conversation.repository';
import type { AiGenerationRepository } from '../../domain/repositories/ai-generation.repository';
import type { AiMessageRepository } from '../../domain/repositories/ai-message.repository';
import type { AiUsageRepository } from '../../domain/repositories/ai-usage.repository';
import type { AiRuntimePort } from '../ports/ai-runtime.port';
import { AiAssistantService } from './ai-assistant.service';

const request = {
  requestId: 'request-1',
  userId: 'user-1',
  conversationId: 'conversation-1',
  capability: 'CHAT',
  content: 'Hello',
  input: { message: 'Hello' },
};

function createFixture(runtimeExecute: jest.Mock) {
  const conversation = AiConversation.create({
    id: 'conversation-1',
    userId: 'user-1',
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
  const runInTransaction = jest.fn(
    async (callback: (context: unknown) => Promise<unknown>) =>
      await callback({}),
  );

  const service = new AiAssistantService(
    {
      findByIdAndUserId: findConversation,
    } as unknown as AiConversationRepository,
    { save: saveMessage } as unknown as AiMessageRepository,
    {
      save: saveGeneration,
      findByIdAndUserId: findGeneration,
    } as unknown as AiGenerationRepository,
    { save: saveUsage } as unknown as AiUsageRepository,
    { execute: runtimeExecute } as AiRuntimePort,
    { runInTransaction } as unknown as UnitOfWork,
    {
      authorize: jest.fn().mockResolvedValue(true),
    } as unknown as AuthorizationService,
  );

  return {
    service,
    getGeneration: () => generation,
    saveMessage,
    savedMessageRoles,
    saveGeneration,
    saveUsage,
    runInTransaction,
  };
}

describe('AiAssistantService', () => {
  it('persists request, completes generation, response, and usage', async () => {
    const runtimeExecute = jest.fn().mockResolvedValue({
      output: { text: 'Hi' },
      provider: 'TEST',
      model: 'test-model',
      usage: {
        promptTokens: 2,
        completionTokens: 3,
        totalTokens: 5,
      },
    });
    const fixture = createFixture(runtimeExecute);

    const result = await fixture.service.submit(request);

    expect(runtimeExecute).toHaveBeenCalledWith({
      requestId: 'request-1',
      capability: 'CHAT',
      input: { message: 'Hello' },
      context: undefined,
    });
    expect(fixture.runInTransaction).toHaveBeenCalledTimes(2);
    expect(fixture.saveMessage).toHaveBeenCalledTimes(2);
    expect(fixture.savedMessageRoles).toEqual([
      AiMessageRole.USER,
      AiMessageRole.ASSISTANT,
    ]);
    expect(fixture.saveUsage).toHaveBeenCalledTimes(1);
    expect(result.status).toBe(AiGenerationStatus.COMPLETED);
  });

  it('does not fail a generation that already left PROCESSING', async () => {
    const runtimeExecute = jest.fn().mockResolvedValue({
      output: { text: 'Hi' },
      provider: 'TEST',
      model: 'test-model',
    });
    const fixture = createFixture(runtimeExecute);
    fixture.runInTransaction.mockImplementationOnce(
      async (callback: (context: unknown) => Promise<unknown>) =>
        await callback({}),
    );
    fixture.runInTransaction.mockImplementationOnce(() => {
      fixture.getGeneration()?.complete({ outputData: { text: 'Hi' } });
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
});
