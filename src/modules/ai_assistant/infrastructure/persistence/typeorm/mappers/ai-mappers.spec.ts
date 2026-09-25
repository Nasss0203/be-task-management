import { AiConversation } from 'src/modules/ai_assistant/domain/aggregates/ai-conversation/ai-conversation.aggregate';
import { AiGeneration } from 'src/modules/ai_assistant/domain/aggregates/ai-generation/ai-generation.aggregate';
import { AiMessage } from 'src/modules/ai_assistant/domain/entities/ai-message.entity';
import { AiToolCall } from 'src/modules/ai_assistant/domain/entities/ai-tool-call.entity';
import { AiUsage } from 'src/modules/ai_assistant/domain/entities/ai-usage.entity';
import { AiConversationStatus } from 'src/modules/ai_assistant/domain/enums/ai-conversation-status.enum';
import { AiGenerationStatus } from 'src/modules/ai_assistant/domain/enums/ai-generation-status.enum';
import { AiMessageRole } from 'src/modules/ai_assistant/domain/enums/ai-message-role.enum';
import { AiToolCallStatus } from 'src/modules/ai_assistant/domain/enums/ai-tool-call-status.enum';
import { AiConversationMapper } from './ai-conversation.mapper';
import { AiGenerationMapper } from './ai-generation.mapper';
import { AiMessageMapper } from './ai-message.mapper';
import { AiToolCallMapper } from './ai-tool-call.mapper';
import { AiUsageMapper } from './ai-usage.mapper';

const createdAt = new Date('2026-01-01T00:00:00.000Z');
const updatedAt = new Date('2026-01-02T00:00:00.000Z');

describe('AI Assistant mappers', () => {
  it('round-trips a conversation', () => {
    const domain = AiConversation.restore({
      id: 'conversation-1',
      userId: 'user-1',
      workspaceId: null,
      title: null,
      status: AiConversationStatus.ARCHIVED,
      createdAt,
      updatedAt,
    });

    const restored = AiConversationMapper.toDomain(
      AiConversationMapper.toOrm(domain),
    );
    expect(restored.getId()).toBe('conversation-1');
    expect(restored.getWorkspaceId()).toBeNull();
    expect(restored.getStatus()).toBe(AiConversationStatus.ARCHIVED);
    expect(restored.getUpdatedAt()).toBe(updatedAt);
  });

  it('round-trips a message including metadata', () => {
    const domain = AiMessage.restore({
      id: 'message-1',
      conversationId: 'conversation-1',
      role: AiMessageRole.TOOL,
      content: 'result',
      metadata: { resourceCount: 2 },
      createdAt,
    });

    const restored = AiMessageMapper.toDomain(AiMessageMapper.toOrm(domain));
    expect(restored.getMetadata()).toEqual({ resourceCount: 2 });
    expect(restored.getCreatedAt()).toBe(createdAt);
  });

  it('round-trips a generation including nullable and JSON fields', () => {
    const domain = AiGeneration.restore({
      id: 'generation-1',
      conversationId: null,
      userId: 'user-1',
      workspaceId: null,
      capability: 'WRITING_IMPROVE',
      status: AiGenerationStatus.FAILED,
      inputData: { text: 'draft' },
      outputData: null,
      provider: 'TEST',
      model: 'test-model',
      errorCode: 'FAILED',
      errorMessage: 'failed',
      appliedAt: null,
      createdAt,
      updatedAt,
    });

    const restored = AiGenerationMapper.toDomain(
      AiGenerationMapper.toOrm(domain),
    );
    expect(restored.getInputData()).toEqual({ text: 'draft' });
    expect(restored.getErrorCode()).toBe('FAILED');
    expect(restored.getUpdatedAt()).toBe(updatedAt);
  });

  it('round-trips usage including precise cost', () => {
    const domain = AiUsage.restore({
      id: 'usage-1',
      userId: 'user-1',
      workspaceId: null,
      conversationId: 'conversation-1',
      generationId: 'generation-1',
      provider: 'TEST',
      model: 'test-model',
      promptTokens: 2,
      completionTokens: 3,
      totalTokens: 5,
      estimatedCost: '0.00001234',
      currency: 'USD',
      createdAt,
    });

    const restored = AiUsageMapper.toDomain(AiUsageMapper.toOrm(domain));
    expect(restored.getEstimatedCost()).toBe('0.00001234');
    expect(restored.getTotalTokens()).toBe(5);
  });

  it('round-trips a tool call including audit data', () => {
    const domain = AiToolCall.restore({
      id: 'tool-call-1',
      generationId: 'generation-1',
      toolName: 'content.get_page',
      status: AiToolCallStatus.FAILED,
      arguments: { pageId: 'page-1' },
      resultMetadata: null,
      durationMs: 12,
      errorCode: 'DENIED',
      errorMessage: 'denied',
      createdAt,
      updatedAt,
    });

    const restored = AiToolCallMapper.toDomain(AiToolCallMapper.toOrm(domain));
    expect(restored.getArguments()).toEqual({ pageId: 'page-1' });
    expect(restored.getErrorCode()).toBe('DENIED');
    expect(restored.getUpdatedAt()).toBe(updatedAt);
  });
});
