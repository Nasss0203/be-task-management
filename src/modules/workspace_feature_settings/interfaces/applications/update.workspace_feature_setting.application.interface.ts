import { WorkspaceFeatureSettingResponseDto } from '../../dto/response/workspace_feature_setting.response.dto';
import { UpdateWorkspaceFeatureSettingDto } from '../../dto/update-workspace_feature_setting.dto';

export interface UpdateWorkspaceFeatureSettingApplication {
  update(
    id: string,
    dto: UpdateWorkspaceFeatureSettingDto,
  ): Promise<WorkspaceFeatureSettingResponseDto>;
}
