import { BillingPlanFeature } from '../../../../domain/entities/billing-plan-feature.entity';
import { BillingPlanFeatureOrmEntity } from '../entities/billing-plan-feature.orm-entity';

export class BillingPlanFeatureMapper {
  static toDomain(entity: BillingPlanFeatureOrmEntity): BillingPlanFeature {
    return BillingPlanFeature.reconstitute({
      id: entity.id,
      planId: entity.plan_id,
      featureId: entity.feature_id,
      value: entity.value,
      createdAt: entity.created_at,
      updatedAt: entity.updated_at,
    });
  }

  static toOrm(planFeature: BillingPlanFeature): BillingPlanFeatureOrmEntity {
    const entity = new BillingPlanFeatureOrmEntity();

    entity.id = planFeature.getId();
    entity.plan_id = planFeature.getPlanId();
    entity.feature_id = planFeature.getFeatureId();
    entity.value = planFeature.getValue();
    entity.created_at = planFeature.getCreatedAt();
    entity.updated_at = planFeature.getUpdatedAt();

    return entity;
  }
}
