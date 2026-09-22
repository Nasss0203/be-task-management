import { Inject, Injectable } from '@nestjs/common';

import { ADMIN_TYPES } from '../../../admin.types';
import { AdminBillingOverviewResponseDto } from '../../dto/response/admin-billing-overview.response.dto';
import type { AdminBillingReader } from '../../ports/admin-billing-reader.port';
import { GetAdminBillingOverviewQuery } from './get-admin-billing-overview.query';

@Injectable()
export class GetAdminBillingOverviewHandler {
  constructor(
    @Inject(ADMIN_TYPES.ports.BillingReader)
    private readonly adminBillingReader: AdminBillingReader,
  ) {}

  async execute(
    _query: GetAdminBillingOverviewQuery,
  ): Promise<AdminBillingOverviewResponseDto> {
    const overview = await this.adminBillingReader.getOverview();

    return {
      paidRevenueThisMonth: overview.paidRevenueThisMonth,
      activeSubscriptions: overview.activeSubscriptions,
      pendingPayments: overview.pendingPayments,
      failedOrExpiredPayments: overview.failedOrExpiredPayments,
      failedWebhookEvents: overview.failedWebhookEvents,
      currency: overview.currency,
    };
  }
}
