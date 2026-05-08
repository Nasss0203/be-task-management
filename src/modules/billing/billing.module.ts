import { Module } from '@nestjs/common';
import { BillingController } from './controller/billing.controller';

@Module({
  controllers: [BillingController],
  providers: [],
})
export class BillingModule {}
