import { FeatureKey } from '../../constants/feature-key.constant';

export interface FeatureAccessService {
  assertUserWorkspaceMembership(
    userId: string,
    workspaceId: string,
  ): Promise<void>;
  assertFeatureEnabledForWorkspace(
    workspaceId: string,
    featureKey: FeatureKey | string,
  ): Promise<void>;
  isFeatureEnabledForWorkspace(
    workspaceId: string,
    featureKey: FeatureKey | string,
  ): Promise<boolean>;
}
