import type { PersistenceContext } from 'src/shared/domain/persistence-context';

import type { MarketplaceCommissionRate } from '../entities/marketplace-commission-rate.entity';

export interface MarketplaceCommissionRateRepository {
  create(
    rate: MarketplaceCommissionRate,
    context?: PersistenceContext,
  ): Promise<MarketplaceCommissionRate>;

  findRecent(
    limit: number,
    context?: PersistenceContext,
  ): Promise<MarketplaceCommissionRate[]>;
}
