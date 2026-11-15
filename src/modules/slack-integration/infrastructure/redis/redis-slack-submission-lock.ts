import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

import type { SlackSubmissionLock } from '../../application/ports/slack-submission-lock.port';

@Injectable()
export class RedisSlackSubmissionLock
  implements SlackSubmissionLock, OnModuleDestroy
{
  private readonly redis: Redis;

  constructor(configService: ConfigService) {
    this.redis = new Redis({
      host: configService.get<string>('REDIS_HOST', '127.0.0.1'),
      port: Number(configService.get<string>('REDIS_PORT', '6379')),
      lazyConnect: true,
      maxRetriesPerRequest: 1,
    });
  }

  async acquire(key: string, ttlMs: number): Promise<boolean> {
    return (await this.redis.set(key, '1', 'PX', ttlMs, 'NX')) === 'OK';
  }

  async release(key: string): Promise<void> {
    await this.redis.del(key);
  }

  async onModuleDestroy(): Promise<void> {
    await this.redis.quit();
  }
}
