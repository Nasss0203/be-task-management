import { AiToolCallStatus } from '../enums/ai-tool-call-status.enum';
import { InvalidAiToolCallTransitionException } from '../exceptions/invalid-ai-tool-call-transition.exception';
import { AiToolCall } from './ai-tool-call.entity';

describe('AiToolCall', () => {
  it('transitions through RUNNING to SUCCEEDED', () => {
    const toolCall = AiToolCall.create({
      generationId: 'generation-1',
      toolName: 'content.get_page',
    });

    toolCall.start();
    toolCall.succeed({ resourceCount: 1 }, 20);

    expect(toolCall.getStatus()).toBe(AiToolCallStatus.SUCCEEDED);
    expect(toolCall.getDurationMs()).toBe(20);
  });

  it('transitions RUNNING to FAILED', () => {
    const toolCall = AiToolCall.create({
      generationId: 'generation-1',
      toolName: 'content.get_page',
    });

    toolCall.start();
    toolCall.fail('DENIED', 'denied', 8);

    expect(toolCall.getStatus()).toBe(AiToolCallStatus.FAILED);
    expect(toolCall.getErrorCode()).toBe('DENIED');
    expect(toolCall.getDurationMs()).toBe(8);
  });

  it('rejects completing a pending call', () => {
    const toolCall = AiToolCall.create({
      generationId: 'generation-1',
      toolName: 'content.get_page',
    });

    expect(() => toolCall.succeed(null, 1)).toThrow(
      InvalidAiToolCallTransitionException,
    );
  });
});
