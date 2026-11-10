import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject, Logger } from '@nestjs/common';
import type { Job } from 'bullmq';

import { ProcessSubscriptionExpiryCommand } from '../../application/commands/subscription/process-subscription-expiry/process-subscription-expiry.command';
import type { ProcessSubscriptionExpiryHandler } from '../../application/commands/subscription/process-subscription-expiry/process-subscription-expiry.handler';
import { BILLING_TYPES } from '../../billing.types';
import {
  PROCESS_SUBSCRIPTION_EXPIRY_JOB,
  SUBSCRIPTION_EXPIRY_QUEUE,
} from './subscription-expiry-queue.constants';

@Processor(SUBSCRIPTION_EXPIRY_QUEUE)
export class SubscriptionExpiryProcessor extends WorkerHost {
  private readonly logger = new Logger(SubscriptionExpiryProcessor.name);

  constructor(
    @Inject(BILLING_TYPES.applications.ProcessSubscriptionExpiryHandler)
    private readonly handler: ProcessSubscriptionExpiryHandler,
  ) {
    super();
  }

  async process(job: Job): Promise<void> {
    if (job.name !== PROCESS_SUBSCRIPTION_EXPIRY_JOB) {
      return;
    }

    const result = await this.handler.execute(
      new ProcessSubscriptionExpiryCommand(),
    );
    this.logger.log(
      `Subscription expiry: ${result.reminded} reminded, ${result.downgraded} downgraded, ${result.failed} failed`,
    );
  }
}
