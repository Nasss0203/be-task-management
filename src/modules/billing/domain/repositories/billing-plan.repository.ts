export abstract class BillingPlanRepository {}
import type { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';
import { BillingPlan } from '../entities/billing-plan.entity';

export interface BillingPlanRepository {
  save(plan: BillingPlan, context?: PersistenceContext): Promise<BillingPlan>;

  findById(
    id: string,
    context?: PersistenceContext,
  ): Promise<BillingPlan | null>;

  findByCode(
    code: string,
    context?: PersistenceContext,
  ): Promise<BillingPlan | null>;

  findActivePublic(context?: PersistenceContext): Promise<BillingPlan[]>;
}