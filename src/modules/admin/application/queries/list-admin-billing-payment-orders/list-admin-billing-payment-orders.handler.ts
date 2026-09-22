import { Inject, Injectable } from '@nestjs/common';

import { ADMIN_TYPES } from '../../../admin.types';
import { AdminBillingPaymentOrderListResponseDto } from '../../dto/response/admin-billing-payment-order-list.response.dto';
import type { AdminBillingReader } from '../../ports/admin-billing-reader.port';
import { ListAdminBillingPaymentOrdersQuery } from './list-admin-billing-payment-orders.query';

@Injectable()
export class ListAdminBillingPaymentOrdersHandler {
  constructor(
    @Inject(ADMIN_TYPES.ports.BillingReader)
    private readonly adminBillingReader: AdminBillingReader,
  ) {}

  async execute(
    query: ListAdminBillingPaymentOrdersQuery,
  ): Promise<AdminBillingPaymentOrderListResponseDto> {
    const result = await this.adminBillingReader.listPaymentOrders({
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
