import { Feature } from '../domain/entities/feature.entity';
import { FeatureModel } from '../domain/models/feature.model';
import { FeatureResponseDto } from '../dto/response/feature.response.dto';
import { SaveFeatureInput } from '../interfaces/repositories/create.feature.repository.interface';

export class FeatureMapper {
  static toModel(entity: Feature): FeatureModel {
    return new FeatureModel(
      entity.id,
      entity.code,
      entity.name,
      entity.description ?? null,
      entity.category ?? null,
      entity.isActive,
      entity.metadata ?? null,
      entity.createdAt,
      entity.updatedAt,
      entity.deletedAt ?? null,
    );
  }

  static toEntity(model: FeatureModel | SaveFeatureInput): Feature {
    const e = new Feature();

    if ('id' in model && model.id != null) e.id = model.id;
    e.code = model.code;
    e.name = model.name;
    e.description = model.description ?? null;
    e.category = model.category ?? null;
    e.isActive = model.isActive ?? true;
    e.metadata = model.metadata ?? null;
    if (model.createdAt != null) e.createdAt = model.createdAt;
    if (model.updatedAt != null) e.updatedAt = model.updatedAt;
    if (model.deletedAt !== undefined) e.deletedAt = model.deletedAt ?? null;

    return e;
  }

  static toResponse(model: FeatureModel): FeatureResponseDto {
    return {
      id: model.id,
      code: model.code,
      name: model.name,
      description: model.description,
      category: model.category,
      isActive: model.isActive,
      metadata: model.metadata,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
      deletedAt: model.deletedAt,
    };
  }
}
