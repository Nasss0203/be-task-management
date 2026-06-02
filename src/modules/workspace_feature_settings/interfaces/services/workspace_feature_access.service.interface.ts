import { WorkspaceFeatureStatusModel } from '../../domain/models/workspace_feature_status.model';

export interface WorkspaceFeatureAccessService {
  findWorkspaceFeatures(
    workspaceId: string,
  ): Promise<WorkspaceFeatureStatusModel[]>;
  updateWorkspaceFeature(input: {
    workspaceId: string;
    featureCode: string;
    enabled: boolean;
    userId: string;
  }): Promise<WorkspaceFeatureStatusModel>;
}
