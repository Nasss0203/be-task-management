import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AI_ASSISTANT_TYPES } from '../../ai-assistant.types';
import type { AiUsageRepository } from '../../domain/repositories/ai-usage.repository';

export const AI_DAILY_LIMIT_REACHED = 'AI_DAILY_LIMIT_REACHED';

const LIMITED_PROVIDER = 'gemini';
const DEFAULT_DAILY_CALLS = 100;
const VIETNAM_OFFSET_MS = 7 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class AiUsageQuotaService {
  constructor(
    @Inject(AI_ASSISTANT_TYPES.repositories.AiUsageRepository)
    private readonly usageRepository: AiUsageRepository,
    private readonly configService: ConfigService,
  ) {}

  async assertWithinDailyLimit(
    userId: string,
    now = new Date(),
  ): Promise<void> {
    const limit = this.dailyLimit();
    if (limit === 0) {
      return;
    }
    const used = await this.usageRepository.countByUser(userId, {
      provider: LIMITED_PROVIDER,
      from: startOfVietnamDay(now),
    });
    if (used >= limit) {
      throw new HttpException(
        {
          code: AI_DAILY_LIMIT_REACHED,
          message: 'Daily AI request limit reached',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  private dailyLimit(): number {
    const raw = this.configService
      .get<string>('AI_GEMINI_DAILY_CALLS_PER_USER')
      ?.toString()
      .trim();
    return raw && /^\d+$/u.test(raw) ? Number(raw) : DEFAULT_DAILY_CALLS;
  }
}

function startOfVietnamDay(now: Date): Date {
  const local = now.getTime() + VIETNAM_OFFSET_MS;
  return new Date(local - (local % DAY_MS) - VIETNAM_OFFSET_MS);
}
