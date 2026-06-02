import { EntityManager } from 'typeorm';
import { WorkspaceFeatureSettingModel } from '../../domain/models/workspace_feature_setting.model';
import { UpdateWorkspaceFeatureSettingDto } from '../../dto/update-workspace_feature_setting.dto';

export interface UpdateWorkspaceFeatureSettingService {
  update(
    id: string,
    dto: UpdateWorkspaceFeatureSettingDto,
    manager?: EntityManager,
  ): Promise<WorkspaceFeatureSettingModel>;
}
