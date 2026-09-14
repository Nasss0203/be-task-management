import type { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';
import { BillingFeature } from '../entities/billing-feature.entity';

export interface BillingFeatureRepository {
  save(
    feature: BillingFeature,
    context?: PersistenceContext,
  ): Promise<BillingFeature>;

  findById(
    id: string,
    context?: PersistenceContext,
  ): Promise<BillingFeature | null>;

  findByCode(
    code: string,
    context?: PersistenceContext,
  ): Promise<BillingFeature | null>;

  findAll(context?: PersistenceContext): Promise<BillingFeature[]>;
}
