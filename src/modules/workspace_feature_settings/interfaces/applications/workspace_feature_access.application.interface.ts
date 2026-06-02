import { WorkspaceFeatureStatusResponseDto } from '../../dto/response/workspace_feature_status.response.dto';
import { UpdateWorkspaceFeatureDto } from '../../dto/update-workspace-feature.dto';

export interface WorkspaceFeatureAccessApplication {
  findWorkspaceFeatures(
    workspaceId: string,
  ): Promise<WorkspaceFeatureStatusResponseDto[]>;
  updateWorkspaceFeature(input: {
    workspaceId: string;
    featureCode: string;
    dto: UpdateWorkspaceFeatureDto;
    userId: string;
  }): Promise<WorkspaceFeatureStatusResponseDto>;
}
