import type { PersistenceContext } from 'src/shared/domain/persistence-context';

export interface MarketplaceCommissionRateReader {
  getCurrentRateBps(context?: PersistenceContext): Promise<number>;
}
