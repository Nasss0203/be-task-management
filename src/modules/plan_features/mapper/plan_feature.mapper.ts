import { PlanFeature } from '../domain/entities/plan_feature.entity';
import { PlanFeatureModel } from '../domain/models/plan_feature.model';
import { PlanFeatureResponseDto } from '../dto/response/plan_feature.response.dto';
import { SavePlanFeatureInput } from '../interfaces/repositories/create.plan_feature.repository.interface';

export class PlanFeatureMapper {
  static toModel(entity: PlanFeature): PlanFeatureModel {
    return new PlanFeatureModel(
      entity.id,
      entity.planId,
      entity.featureId,
      entity.enabled,
      entity.metadata ?? null,
      entity.createdAt,
      entity.updatedAt,
      entity.deletedAt ?? null,
    );
  }

  static toEntity(model: PlanFeatureModel | SavePlanFeatureInput): PlanFeature {
    const e = new PlanFeature();

    if ('id' in model && model.id != null) e.id = model.id;
    e.planId = model.planId;
    e.featureId = model.featureId;
    e.enabled = model.enabled ?? true;
    e.metadata = model.metadata ?? null;
    if (model.createdAt != null) e.createdAt = model.createdAt;
    if (model.updatedAt != null) e.updatedAt = model.updatedAt;
    if (model.deletedAt !== undefined) e.deletedAt = model.deletedAt ?? null;

    return e;
  }

  static toResponse(model: PlanFeatureModel): PlanFeatureResponseDto {
    return {
      id: model.id,
      planId: model.planId,
      featureId: model.featureId,
      enabled: model.enabled,
      metadata: model.metadata,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
      deletedAt: model.deletedAt,
    };
  }
}
