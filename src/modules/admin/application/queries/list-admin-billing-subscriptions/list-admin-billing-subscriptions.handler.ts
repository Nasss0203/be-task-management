import { Inject, Injectable } from '@nestjs/common';

import { ADMIN_TYPES } from '../../../admin.types';
import { AdminBillingSubscriptionListResponseDto } from '../../dto/response/admin-billing-subscription-list.response.dto';
import type { AdminBillingReader } from '../../ports/admin-billing-reader.port';
import { ListAdminBillingSubscriptionsQuery } from './list-admin-billing-subscriptions.query';

@Injectable()
export class ListAdminBillingSubscriptionsHandler {
  constructor(
    @Inject(ADMIN_TYPES.ports.BillingReader)
    private readonly adminBillingReader: AdminBillingReader,
  ) {}

  async execute(
    query: ListAdminBillingSubscriptionsQuery,
  ): Promise<AdminBillingSubscriptionListResponseDto> {
    const result = await this.adminBillingReader.listSubscriptions({
      page: query.page,
      limit: query.limit,
      search: query.search,
      status: query.status,
      provider: query.provider,
      planCode: query.planCode,
    });

    return {
      items: result.items,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages:
        result.total === 0 ? 0 : Math.ceil(result.total / result.limit),
    };
  }
}
