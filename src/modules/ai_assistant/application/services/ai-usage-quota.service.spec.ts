import { HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AiUsageRepository } from '../../domain/repositories/ai-usage.repository';
import {
  AI_DAILY_LIMIT_REACHED,
  AiUsageQuotaService,
} from './ai-usage-quota.service';

describe('AiUsageQuotaService', () => {
  const noonInVietnam = new Date('2026-11-21T05:00:00.000Z');
  const midnightInVietnam = new Date('2026-11-20T17:00:00.000Z');

  function service(limit: string | undefined, used: number) {
    const countByUser = jest.fn().mockResolvedValue(used);
    const quota = new AiUsageQuotaService(
      { countByUser } as unknown as AiUsageRepository,
      new ConfigService(
        limit === undefined ? {} : { AI_GEMINI_DAILY_CALLS_PER_USER: limit },
      ),
    );
    return { quota, countByUser };
  }

  async function rejection(promise: Promise<unknown>): Promise<unknown> {
    try {
      await promise;
    } catch (error: unknown) {
      return error;
    }
    throw new Error('expected a rejection');
  }

  it('counts only Gemini calls of the user since midnight in Vietnam', async () => {
    const { quota, countByUser } = service('3', 2);
    await quota.assertWithinDailyLimit('user-1', noonInVietnam);
    expect(countByUser).toHaveBeenCalledWith('user-1', {
      provider: 'gemini',
      from: midnightInVietnam,
    });
  });

  it('uses the Vietnam day just after midnight there', async () => {
    const { quota, countByUser } = service('3', 0);
    await quota.assertWithinDailyLimit(
      'user-1',
      new Date('2026-11-20T17:00:01.000Z'),
    );
    expect(countByUser).toHaveBeenCalledWith('user-1', {
      provider: 'gemini',
      from: midnightInVietnam,
    });
  });

  it('lets the last call under the limit through', async () => {
    const { quota } = service('3', 2);
    await expect(
      quota.assertWithinDailyLimit('user-1', noonInVietnam),
    ).resolves.toBeUndefined();
  });

  it('refuses with 429 AI_DAILY_LIMIT_REACHED once the limit is used', async () => {
    const { quota } = service('3', 3);
    const error = await rejection(
      quota.assertWithinDailyLimit('user-1', noonInVietnam),
    );
    expect(error).toBeInstanceOf(HttpException);
    expect((error as HttpException).getStatus()).toBe(
      HttpStatus.TOO_MANY_REQUESTS,
    );
    expect((error as HttpException).getResponse()).toMatchObject({
      code: AI_DAILY_LIMIT_REACHED,
    });
  });

  it.each([undefined, '', 'abc', '-5', '2.5'])(
    'uses 100 calls when the setting is %p',
    async (limit) => {
      const under = service(limit, 99);
      await expect(
        under.quota.assertWithinDailyLimit('user-1', noonInVietnam),
      ).resolves.toBeUndefined();
      const over = service(limit, 100);
      await expect(
        over.quota.assertWithinDailyLimit('user-1', noonInVietnam),
      ).rejects.toBeInstanceOf(HttpException);
    },
  );

  it('does not limit or count when the setting is 0', async () => {
    const { quota, countByUser } = service('0', 1000);
    await expect(
      quota.assertWithinDailyLimit('user-1', noonInVietnam),
    ).resolves.toBeUndefined();
    expect(countByUser).not.toHaveBeenCalled();
  });
});
