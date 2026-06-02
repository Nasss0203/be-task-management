import { EntityManager } from 'typeorm';
import { WorkspaceFeatureSettingModel } from '../../domain/models/workspace_feature_setting.model';
import { CreateWorkspaceFeatureSettingDto } from '../../dto/create-workspace_feature_setting.dto';

export interface CreateWorkspaceFeatureSettingService {
  create(
    dto: CreateWorkspaceFeatureSettingDto,
    manager?: EntityManager,
  ): Promise<WorkspaceFeatureSettingModel>;
}
