import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import type { Queue } from 'bullmq';

import {
  BILLING_TIME_ZONE,
  SUBSCRIPTION_EXPIRY_CRON,
} from '../../domain/constants/subscription-expiry.constant';
import {
  PROCESS_SUBSCRIPTION_EXPIRY_JOB,
  SUBSCRIPTION_EXPIRY_QUEUE,
  SUBSCRIPTION_EXPIRY_SCHEDULER,
} from './subscription-expiry-queue.constants';

@Injectable()
export class SubscriptionExpiryScheduler implements OnModuleInit {
  private readonly logger = new Logger(SubscriptionExpiryScheduler.name);

  constructor(
    @InjectQueue(SUBSCRIPTION_EXPIRY_QUEUE)
    private readonly queue: Queue,
  ) {}

  onModuleInit(): void {
    this.queue
      .upsertJobScheduler(
        SUBSCRIPTION_EXPIRY_SCHEDULER,
        { pattern: SUBSCRIPTION_EXPIRY_CRON, tz: BILLING_TIME_ZONE },
        {
          name: PROCESS_SUBSCRIPTION_EXPIRY_JOB,
          opts: { removeOnComplete: true, removeOnFail: 100 },
        },
      )
      .catch((error: unknown) => {
        this.logger.warn(
          `Subscription expiry scheduler was not registered: ${(error as Error).message}`,
        );
      });
  }
}
