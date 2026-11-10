import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';

import { BillingModule } from './billing.module';
import { SubscriptionExpiryProcessor } from './infrastructure/queue/subscription-expiry.processor';
import { SubscriptionExpiryScheduler } from './infrastructure/queue/subscription-expiry.scheduler';
import { SUBSCRIPTION_EXPIRY_QUEUE } from './infrastructure/queue/subscription-expiry-queue.constants';

@Module({
  imports: [
    BillingModule,
    BullModule.registerQueue({ name: SUBSCRIPTION_EXPIRY_QUEUE }),
  ],
  providers: [SubscriptionExpiryScheduler, SubscriptionExpiryProcessor],
})
export class BillingJobsModule {}
