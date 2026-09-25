import { AiGenerationStatus } from '../../enums/ai-generation-status.enum';
import { InvalidAiGenerationTransitionException } from '../../exceptions/invalid-ai-generation-transition.exception';
import { AiGeneration } from './ai-generation.aggregate';

const createGeneration = () =>
  AiGeneration.create({
    userId: 'user-1',
    capability: 'CHAT',
    inputData: { prompt: 'Hello' },
  });

describe('AiGeneration', () => {
  it('transitions PROCESSING to COMPLETED and then APPLIED', () => {
    const generation = createGeneration();

    generation.complete({
      outputData: { text: 'Hi' },
      provider: 'TEST',
      model: 'test-model',
    });
    expect(generation.getStatus()).toBe(AiGenerationStatus.COMPLETED);

    generation.apply(new Date('2026-01-01T00:00:00.000Z'));
    expect(generation.getStatus()).toBe(AiGenerationStatus.APPLIED);
    expect(generation.getAppliedAt()).toEqual(
      new Date('2026-01-01T00:00:00.000Z'),
    );
  });

  it('transitions PROCESSING to FAILED', () => {
    const generation = createGeneration();
    generation.fail('RUNTIME_ERROR', 'Runtime failed');

    expect(generation.getStatus()).toBe(AiGenerationStatus.FAILED);
    expect(generation.getErrorCode()).toBe('RUNTIME_ERROR');
  });

  it('transitions COMPLETED to DISCARDED', () => {
    const generation = createGeneration();
    generation.complete({ outputData: { text: 'Hi' } });
    generation.discard();

    expect(generation.getStatus()).toBe(AiGenerationStatus.DISCARDED);
  });

  it('rejects invalid transitions', () => {
    const generation = createGeneration();

    expect(() => generation.apply()).toThrow(
      InvalidAiGenerationTransitionException,
    );

    generation.complete({ outputData: { text: 'Hi' } });
    generation.apply();

    expect(() => generation.discard()).toThrow(
      InvalidAiGenerationTransitionException,
    );
  });
});
