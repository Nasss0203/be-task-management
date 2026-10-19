import { Inject, Injectable } from '@nestjs/common';

import { ANALYTICS_TIME_ZONE } from 'src/modules/marketplace/application/services/template-analytics-range';

import { ADMIN_TYPES } from '../../../admin.types';
import type { AdminMarketplaceSalesOverviewResponseDto } from '../../dto/response/admin-marketplace-sales-overview.response.dto';
import type { AdminMarketplaceSalesReader } from '../../ports/admin-marketplace-sales-reader.port';
import { GetAdminMarketplaceSalesOverviewQuery } from './get-admin-marketplace-sales-overview.query';

@Injectable()
export class GetAdminMarketplaceSalesOverviewHandler {
  constructor(
    @Inject(ADMIN_TYPES.ports.MarketplaceSalesReader)
    private readonly salesReader: AdminMarketplaceSalesReader,
  ) {}

  execute(
    _query: GetAdminMarketplaceSalesOverviewQuery,
  ): Promise<AdminMarketplaceSalesOverviewResponseDto> {
    return this.salesReader.getOverview(ANALYTICS_TIME_ZONE);
  }
}
