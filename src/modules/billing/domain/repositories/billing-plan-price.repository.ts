import type { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';
import { BillingProvider } from '../constants/billing-provider.constant';
import { BillingPlanPrice } from '../entities/billing-plan-price.entity';

export interface BillingPlanPriceRepository {
  save(
    planPrice: BillingPlanPrice,
    context?: PersistenceContext,
  ): Promise<BillingPlanPrice>;

  findById(
    id: string,
    context?: PersistenceContext,
  ): Promise<BillingPlanPrice | null>;

  findActiveById(
    id: string,
    context?: PersistenceContext,
  ): Promise<BillingPlanPrice | null>;

  findActiveByPlanId(
    planId: string,
    context?: PersistenceContext,
  ): Promise<BillingPlanPrice[]>;

  findActiveByPlanIds(
    planIds: readonly string[],
    context?: PersistenceContext,
  ): Promise<BillingPlanPrice[]>;

  findActiveByPlanIdAndProvider(
    planId: string,
    provider: BillingProvider,
    context?: PersistenceContext,
  ): Promise<BillingPlanPrice[]>;
}
