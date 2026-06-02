import { EntityManager } from 'typeorm';
import { WorkspaceFeatureSettingModel } from '../../domain/models/workspace_feature_setting.model';

export interface FindWorkspaceFeatureSettingRepository {
  findAll(manager?: EntityManager): Promise<WorkspaceFeatureSettingModel[]>;
  findById(
    id: string,
    manager?: EntityManager,
  ): Promise<WorkspaceFeatureSettingModel | null>;
  findByWorkspaceAndFeature(
    workspaceId: string,
    featureId: string,
    manager?: EntityManager,
  ): Promise<WorkspaceFeatureSettingModel | null>;
}
