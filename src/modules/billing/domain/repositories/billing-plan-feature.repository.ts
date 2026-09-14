import type { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';
import { BillingPlanFeature } from '../entities/billing-plan-feature.entity';

export interface BillingPlanFeatureRepository {
  save(
    planFeature: BillingPlanFeature,
    context?: PersistenceContext,
  ): Promise<BillingPlanFeature>;

  findById(
    id: string,
    context?: PersistenceContext,
  ): Promise<BillingPlanFeature | null>;

  findByPlanId(
    planId: string,
    context?: PersistenceContext,
  ): Promise<BillingPlanFeature[]>;

  findByPlanIds(
    planIds: readonly string[],
    context?: PersistenceContext,
  ): Promise<BillingPlanFeature[]>;

  findByPlanIdAndFeatureId(
    planId: string,
    featureId: string,
    context?: PersistenceContext,
  ): Promise<BillingPlanFeature | null>;
}
