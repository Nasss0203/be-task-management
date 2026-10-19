import { MARKETPLACE_TYPES } from 'src/modules/marketplace/marketplace.types';
import { Inject, Injectable } from '@nestjs/common';

import { DEFAULT_COMMISSION_RATE_BPS } from '../../../../domain/constants/marketplace-commission.constant';
import type { MarketplaceCommissionRateRepository } from '../../../../domain/repositories/marketplace-commission-rate.repository';
import {
  MarketplaceCommissionRateResponseDto,
  MarketplaceCommissionSettingsResponseDto,
} from '../../../dto/marketplace-commission/marketplace-commission-rate.response.dto';

import { GetMarketplaceCommissionRateQuery } from './get-marketplace-commission-rate.query';

const HISTORY_LIMIT = 20;

@Injectable()
export class GetMarketplaceCommissionRateHandler {
  constructor(
    @Inject(MARKETPLACE_TYPES.repositories.MarketplaceCommissionRateRepository)
    private readonly commissionRateRepository: MarketplaceCommissionRateRepository,
  ) {}

  async execute(
    _query: GetMarketplaceCommissionRateQuery,
  ): Promise<MarketplaceCommissionSettingsResponseDto> {
    const history =
      await this.commissionRateRepository.findRecent(HISTORY_LIMIT);

    return {
      rateBps: history[0]?.getRateBps() ?? DEFAULT_COMMISSION_RATE_BPS,
      history: history.map((rate) =>
        MarketplaceCommissionRateResponseDto.fromDomain(rate),
      ),
    };
  }
}
