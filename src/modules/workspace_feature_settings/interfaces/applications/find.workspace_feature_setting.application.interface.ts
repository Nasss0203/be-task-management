import { WorkspaceFeatureSettingResponseDto } from '../../dto/response/workspace_feature_setting.response.dto';

export interface FindWorkspaceFeatureSettingApplication {
  findAll(): Promise<WorkspaceFeatureSettingResponseDto[]>;
  findById(id: string): Promise<WorkspaceFeatureSettingResponseDto>;
}
