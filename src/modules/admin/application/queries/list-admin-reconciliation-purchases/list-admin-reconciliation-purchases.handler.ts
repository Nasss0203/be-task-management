import { Inject, Injectable } from '@nestjs/common';

import { ADMIN_TYPES } from '../../../admin.types';
import { AdminReconciliationPurchaseListResponseDto } from '../../dto/response/admin-reconciliation-purchase-list.response.dto';
import type { AdminMarketplaceSalesReader } from '../../ports/admin-marketplace-sales-reader.port';
import { ListAdminReconciliationPurchasesQuery } from './list-admin-reconciliation-purchases.query';

@Injectable()
export class ListAdminReconciliationPurchasesHandler {
  constructor(
    @Inject(ADMIN_TYPES.ports.MarketplaceSalesReader)
    private readonly salesReader: AdminMarketplaceSalesReader,
  ) {}

  async execute(
    query: ListAdminReconciliationPurchasesQuery,
  ): Promise<AdminReconciliationPurchaseListResponseDto> {
    const result = await this.salesReader.listReconciliationPurchases({
      page: query.page,
      limit: query.limit,
      status: query.status,
      search: query.search,
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
