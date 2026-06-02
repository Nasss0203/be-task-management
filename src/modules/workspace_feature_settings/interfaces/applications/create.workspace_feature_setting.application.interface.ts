import { CreateWorkspaceFeatureSettingDto } from '../../dto/create-workspace_feature_setting.dto';
import { WorkspaceFeatureSettingResponseDto } from '../../dto/response/workspace_feature_setting.response.dto';

export interface CreateWorkspaceFeatureSettingApplication {
  create(
    dto: CreateWorkspaceFeatureSettingDto,
  ): Promise<WorkspaceFeatureSettingResponseDto>;
}
