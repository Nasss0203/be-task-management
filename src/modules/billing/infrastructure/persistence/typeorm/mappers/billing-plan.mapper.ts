import { BillingPlan } from '../../../../domain/entities/billing-plan.entity';
import { BillingPlanOrmEntity } from '../entities/billing-plan.orm-entity';

export class BillingPlanMapper {
  static toDomain(entity: BillingPlanOrmEntity): BillingPlan {
    return BillingPlan.reconstitute({
      id: entity.id,
      code: entity.code,
      name: entity.name,
      description: entity.description ?? null,
      isActive: entity.is_active,
      isPublic: entity.is_public,
      createdAt: entity.created_at,
      updatedAt: entity.updated_at,
    });
  }

  static toOrm(plan: BillingPlan): BillingPlanOrmEntity {
    const entity = new BillingPlanOrmEntity();

    entity.id = plan.getId();
    entity.code = plan.getCode();
    entity.name = plan.getName();
    entity.description = plan.getDescription();
    entity.is_active = plan.getIsActive();
    entity.is_public = plan.getIsPublic();
    entity.created_at = plan.getCreatedAt();
    entity.updated_at = plan.getUpdatedAt();

    return entity;
  }
}
