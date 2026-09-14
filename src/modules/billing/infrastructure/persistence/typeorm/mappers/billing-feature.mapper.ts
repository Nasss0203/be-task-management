import { BillingFeature } from '../../../../domain/entities/billing-feature.entity';
import { BillingFeatureOrmEntity } from '../entities/billing-feature.orm-entity';

export class BillingFeatureMapper {
  static toDomain(entity: BillingFeatureOrmEntity): BillingFeature {
    return BillingFeature.reconstitute({
      id: entity.id,
      code: entity.code,
      name: entity.name,
      description: entity.description ?? null,
      valueType: entity.value_type,
      createdAt: entity.created_at,
      updatedAt: entity.updated_at,
    });
  }

  static toOrm(feature: BillingFeature): BillingFeatureOrmEntity {
    const entity = new BillingFeatureOrmEntity();

    entity.id = feature.getId();
    entity.code = feature.getCode();
    entity.name = feature.getName();
    entity.description = feature.getDescription();
    entity.value_type = feature.getValueType();
    entity.created_at = feature.getCreatedAt();
    entity.updated_at = feature.getUpdatedAt();

    return entity;
  }
}
