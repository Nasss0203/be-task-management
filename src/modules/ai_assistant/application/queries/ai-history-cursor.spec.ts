import { BadRequestException } from '@nestjs/common';
import { decodeAiHistoryCursor, encodeAiHistoryCursor } from './ai-history-cursor';

describe('AI history composite cursor', () => {
  const createdAt = new Date('2026-10-17T07:00:00.123Z');
  const id = '550e8400-e29b-41d4-a716-446655440000';

  it('round trips timestamp and UUID for stable ordering', () => {
    expect(decodeAiHistoryCursor(encodeAiHistoryCursor({ createdAt, id }))).toEqual({
      createdAt,
      id,
    });
  });

  it.each(['not-base64', '', Buffer.from('{}').toString('base64url')])(
    'rejects malformed cursor %s',
    (value) => {
      expect(() => decodeAiHistoryCursor(value)).toThrow(BadRequestException);
    },
  );
});
