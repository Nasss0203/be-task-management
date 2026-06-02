import { EntityManager } from 'typeorm';
import { WorkspaceFeatureSettingModel } from '../../domain/models/workspace_feature_setting.model';

export type SaveWorkspaceFeatureSettingInput = {
  id?: string;
  workspaceId: string;
  featureId: string;
  enabled?: boolean;
  createdBy?: string | null;
  updatedBy?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
};

export interface CreateWorkspaceFeatureSettingRepository {
  save(
    input: SaveWorkspaceFeatureSettingInput,
    manager?: EntityManager,
  ): Promise<WorkspaceFeatureSettingModel>;
}
