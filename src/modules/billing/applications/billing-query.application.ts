import { Inject, Injectable } from '@nestjs/common';

import { type BillingQueryService } from '../interfaces/services/query/billing-query.service.interface';
import { BILLING_TYPES } from '../interfaces/types';
import { type BillingQueryApplication } from '../interfaces/applications/billing-query.application.interface';

@Injectable()
export class BillingQueryApplicationImpl implements BillingQueryApplication {
  constructor(
    @Inject(BILLING_TYPES.services.BillingQueryService)
    private readonly billingQueryService: BillingQueryService,
  ) {}

  getCurrentSubscription(userId: string): Promise<unknown> {
    return this.billingQueryService.getCurrentSubscription(userId);
  }

  getWorkspaceUsageLimits(
    userId: string,
    workspaceId: string,
  ): Promise<unknown[]> {
    return this.billingQueryService.getWorkspaceUsageLimits(
      userId,
      workspaceId,
    );
  }
}
