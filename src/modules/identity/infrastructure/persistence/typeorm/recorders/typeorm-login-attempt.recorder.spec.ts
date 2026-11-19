import { Logger } from '@nestjs/common';
import type { DataSource } from 'typeorm';

import {
  normalizeAttemptedEmail,
  TypeOrmLoginAttemptRecorder,
} from './typeorm-login-attempt.recorder';

describe('TypeOrmLoginAttemptRecorder', () => {
  const createRecorder = (query: jest.Mock) =>
    new TypeOrmLoginAttemptRecorder({ query } as unknown as DataSource);

  it('inserts a failed attempt with the normalized email and client info', async () => {
    const query = jest.fn().mockResolvedValue([]);

    await createRecorder(query).record({
      method: 'PASSWORD',
      result: 'FAILED',
      reason: 'WRONG_PASSWORD',
      userId: 'user-1',
      attemptedEmail: '  User@Example.COM ',
      client: { ipAddress: '203.0.113.5', userAgent: 'x'.repeat(300) },
    });

    const params = (query.mock.calls[0] as [string, unknown[]])[1];
    expect(params).toEqual([
      'user-1',
      'user@example.com',
      'PASSWORD',
      'FAILED',
      'WRONG_PASSWORD',
      '203.0.113.5',
      'x'.repeat(255),
    ]);
  });

  it('stores null reason and client fields for a success without client info', async () => {
    const query = jest.fn().mockResolvedValue([]);

    await createRecorder(query).record({
      method: 'GOOGLE',
      result: 'SUCCESS',
      userId: 'user-1',
      attemptedEmail: null,
    });

    const params = (query.mock.calls[0] as [string, unknown[]])[1];
    expect(params).toEqual([
      'user-1',
      null,
      'GOOGLE',
      'SUCCESS',
      null,
      null,
      null,
    ]);
  });

  it('swallows insert errors and logs them', async () => {
    const query = jest.fn().mockRejectedValue(new Error('db down'));
    const logError = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);

    await expect(
      createRecorder(query).record({
        method: 'PASSWORD',
        result: 'SUCCESS',
        userId: 'user-1',
        attemptedEmail: 'user@example.com',
      }),
    ).resolves.toBeUndefined();
    expect(logError).toHaveBeenCalled();

    logError.mockRestore();
  });

  it.each([
    ['not-an-email', null],
    ['my secret password', null],
    ['', null],
    [null, null],
    [`${'a'.repeat(250)}@x.com`, null],
    [' A@B.Co ', 'a@b.co'],
  ])('normalizes %p to %p', (value, expected) => {
    expect(normalizeAttemptedEmail(value)).toBe(expected);
  });
});
