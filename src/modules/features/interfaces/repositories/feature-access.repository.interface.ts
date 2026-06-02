import { FeatureKey } from '../../constants/feature-key.constant';

export interface FeatureAccessRepository {
  existsUserWorkspaceMembership(
    userId: string,
    workspaceId: string,
  ): Promise<boolean>;
  isFeatureEnabledForWorkspace(
    workspaceId: string,
    featureKey: FeatureKey | string,
  ): Promise<boolean>;
}
