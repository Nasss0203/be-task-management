import { WorkspaceFeatureSetting } from '../domain/entities/workspace_feature_setting.entity';
import { WorkspaceFeatureSettingModel } from '../domain/models/workspace_feature_setting.model';
import { WorkspaceFeatureSettingResponseDto } from '../dto/response/workspace_feature_setting.response.dto';
import { SaveWorkspaceFeatureSettingInput } from '../interfaces/repositories/create.workspace_feature_setting.repository.interface';

export class WorkspaceFeatureSettingMapper {
  static toModel(
    entity: WorkspaceFeatureSetting,
  ): WorkspaceFeatureSettingModel {
    return new WorkspaceFeatureSettingModel(
      entity.id,
      entity.workspaceId,
      entity.featureId,
      entity.enabled,
      entity.createdBy ?? null,
      entity.updatedBy ?? null,
      entity.metadata ?? null,
      entity.createdAt,
      entity.updatedAt,
      entity.deletedAt ?? null,
    );
  }

  static toEntity(
    model: WorkspaceFeatureSettingModel | SaveWorkspaceFeatureSettingInput,
  ): WorkspaceFeatureSetting {
    const e = new WorkspaceFeatureSetting();

    if ('id' in model && model.id != null) e.id = model.id;
    e.workspaceId = model.workspaceId;
    e.featureId = model.featureId;
    e.enabled = model.enabled ?? false;
    e.createdBy = model.createdBy ?? null;
    e.updatedBy = model.updatedBy ?? null;
    e.metadata = model.metadata ?? null;
    if (model.createdAt != null) e.createdAt = model.createdAt;
    if (model.updatedAt != null) e.updatedAt = model.updatedAt;
    if (model.deletedAt !== undefined) e.deletedAt = model.deletedAt ?? null;

    return e;
  }

  static toResponse(
    model: WorkspaceFeatureSettingModel,
  ): WorkspaceFeatureSettingResponseDto {
    return {
      id: model.id,
      workspaceId: model.workspaceId,
      featureId: model.featureId,
      enabled: model.enabled,
      createdBy: model.createdBy,
      updatedBy: model.updatedBy,
      metadata: model.metadata,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
      deletedAt: model.deletedAt,
    };
  }
}
