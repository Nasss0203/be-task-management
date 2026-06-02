import { WorkspaceFeatureStatusModel } from '../../domain/models/workspace_feature_status.model';

export interface WorkspaceFeatureAccessRepository {
  findWorkspaceFeatures(
    workspaceId: string,
  ): Promise<WorkspaceFeatureStatusModel[]>;
  findWorkspaceFeatureByCode(
    workspaceId: string,
    featureCode: string,
  ): Promise<WorkspaceFeatureStatusModel | null>;
  upsertWorkspaceFeatureSetting(input: {
    workspaceId: string;
    featureCode: string;
    enabled: boolean;
    userId: string;
  }): Promise<WorkspaceFeatureStatusModel>;
}
