import { HttpException } from '@nestjs/common';
import type { Request } from 'express';
import type { ValidateUserAuthServiceImpl } from 'src/modules/identity/application/services/validate-user-auth.service';

import { LocalStrategy } from './local.strategy';

describe('LocalStrategy', () => {
  const req = {
    ip: '203.0.113.5',
    headers: { 'user-agent': 'Jest browser' },
  } as unknown as Request;

  const setup = (result: unknown) => {
    const checkCredentials = jest.fn().mockResolvedValue(result);
    const record = jest.fn().mockResolvedValue(undefined);
    const strategy = new LocalStrategy(
      { checkCredentials } as unknown as ValidateUserAuthServiceImpl,
      { record },
    );

    return { strategy, record };
  };

  it('returns the user without recording when credentials are valid', async () => {
    const user = { id: 'user-1' };
    const { strategy, record } = setup({ user, reason: null });

    await expect(
      strategy.validate(req, 'user@example.com', 'secret'),
    ).resolves.toBe(user);
    expect(record).not.toHaveBeenCalled();
  });

  it('records the failure reason with client info and still throws 401', async () => {
    const { strategy, record } = setup({
      user: { id: 'user-1' },
      reason: 'WRONG_PASSWORD',
    });

    await expect(
      strategy.validate(req, 'user@example.com', 'secret'),
    ).rejects.toBeInstanceOf(HttpException);
    expect(record).toHaveBeenCalledWith({
      method: 'PASSWORD',
      result: 'FAILED',
      reason: 'WRONG_PASSWORD',
      userId: 'user-1',
      attemptedEmail: 'user@example.com',
      client: { ipAddress: '203.0.113.5', userAgent: 'Jest browser' },
    });
    expect(JSON.stringify(record.mock.calls)).not.toContain('secret');
  });

  it('records an unknown email without a user id', async () => {
    const { strategy, record } = setup({
      user: null,
      reason: 'USER_NOT_FOUND',
    });

    await expect(
      strategy.validate(req, 'ghost@example.com', 'secret'),
    ).rejects.toBeInstanceOf(HttpException);
    expect(record).toHaveBeenCalledWith(
      expect.objectContaining({ reason: 'USER_NOT_FOUND', userId: null }),
    );
  });
});
