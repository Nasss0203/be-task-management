import { Controller, Get, Inject, Param } from '@nestjs/common';
import { ResponseMessage } from 'src/common/decorator/response-message.decorator';

import { type BillingQueryApplication } from '../interfaces/applications/billing-query.application.interface';
import { BILLING_TYPES } from '../interfaces/types';

@Controller('billing/plans')
export class PlanController {
  constructor(
    @Inject(BILLING_TYPES.applications.BillingQueryApplication)
    private readonly billingQueryApplication: BillingQueryApplication,
  ) {}

  @Get()
  @ResponseMessage('Get billing plans')
  getPlans() {
    return this.billingQueryApplication.getPlans();
  }

  @Get(':planId')
  @ResponseMessage('Get billing plan')
  getPlanById(@Param('planId') planId: string) {
    return this.billingQueryApplication.getPlanById(planId);
  }
}
