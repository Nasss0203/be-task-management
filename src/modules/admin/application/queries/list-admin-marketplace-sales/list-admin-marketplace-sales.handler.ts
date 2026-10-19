import { Inject, Injectable } from '@nestjs/common';

import { ADMIN_TYPES } from '../../../admin.types';
import { AdminMarketplaceSaleListResponseDto } from '../../dto/response/admin-marketplace-sale-list.response.dto';
import type { AdminMarketplaceSalesReader } from '../../ports/admin-marketplace-sales-reader.port';
import { ListAdminMarketplaceSalesQuery } from './list-admin-marketplace-sales.query';

@Injectable()
export class ListAdminMarketplaceSalesHandler {
  constructor(
    @Inject(ADMIN_TYPES.ports.MarketplaceSalesReader)
    private readonly salesReader: AdminMarketplaceSalesReader,
  ) {}

  async execute(
    query: ListAdminMarketplaceSalesQuery,
  ): Promise<AdminMarketplaceSaleListResponseDto> {
    const result = await this.salesReader.listSales({
      page: query.page,
      limit: query.limit,
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
