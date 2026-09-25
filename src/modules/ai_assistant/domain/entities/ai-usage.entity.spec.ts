import { AiUsage } from './ai-usage.entity';

describe('AiUsage', () => {
  const validParams = {
    userId: 'user-1',
    provider: 'TEST',
    model: 'test-model',
    promptTokens: 1,
    completionTokens: 2,
    totalTokens: 3,
  };

  it('accepts non-negative token counts', () => {
    const usage = AiUsage.create(validParams);
    expect(usage.getTotalTokens()).toBe(3);
  });

  it.each(['promptTokens', 'completionTokens', 'totalTokens'] as const)(
    'rejects negative %s',
    (field) => {
      expect(() => AiUsage.create({ ...validParams, [field]: -1 })).toThrow(
        'must be a non-negative integer',
      );
    },
  );

  it('rejects a negative estimated cost', () => {
    expect(() =>
      AiUsage.create({ ...validParams, estimatedCost: '-0.01' }),
    ).toThrow('estimated cost must be non-negative');
  });
});
