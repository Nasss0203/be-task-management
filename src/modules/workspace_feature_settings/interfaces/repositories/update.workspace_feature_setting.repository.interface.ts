import { EntityManager } from 'typeorm';
import { WorkspaceFeatureSettingModel } from '../../domain/models/workspace_feature_setting.model';
import { SaveWorkspaceFeatureSettingInput } from './create.workspace_feature_setting.repository.interface';

export type UpdateWorkspaceFeatureSettingInput =
  SaveWorkspaceFeatureSettingInput & {
    id: string;
  };

export interface UpdateWorkspaceFeatureSettingRepository {
  save(
    input: UpdateWorkspaceFeatureSettingInput,
    manager?: EntityManager,
  ): Promise<WorkspaceFeatureSettingModel>;
}
