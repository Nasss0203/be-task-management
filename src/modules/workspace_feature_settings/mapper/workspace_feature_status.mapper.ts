import { WorkspaceFeatureStatusModel } from '../domain/models/workspace_feature_status.model';
import { WorkspaceFeatureStatusResponseDto } from '../dto/response/workspace_feature_status.response.dto';

export class WorkspaceFeatureStatusMapper {
  static toResponse(
    model: WorkspaceFeatureStatusModel,
  ): WorkspaceFeatureStatusResponseDto {
    return {
      code: model.code,
      name: model.name,
      description: model.description,
      category: model.category,
      planEnabled: model.planEnabled,
      workspaceEnabled: model.workspaceEnabled,
      enabled: model.enabled,
      metadata: model.metadata,
    };
  }
}
