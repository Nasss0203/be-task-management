import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { FeatureKey } from '../constants/feature-key.constant';
import { type FeatureAccessRepository } from '../interfaces/repositories/feature-access.repository.interface';
import { FeatureAccessService } from '../interfaces/services/feature-access.service.interface';
import { FEATURE_TYPES } from '../interfaces/types';

@Injectable()
export class FeatureAccessServiceImpl implements FeatureAccessService {
  constructor(
    @Inject(FEATURE_TYPES.repositories.FeatureAccessRepository)
    private readonly repo: FeatureAccessRepository,
  ) {}

  async assertUserWorkspaceMembership(
    userId: string,
    workspaceId: string,
  ): Promise<void> {
    const isMember = await this.repo.existsUserWorkspaceMembership(
      userId,
      workspaceId,
    );

    if (!isMember) {
      throw new ForbiddenException('Workspace membership not found');
    }
  }

  async assertFeatureEnabledForWorkspace(
    workspaceId: string,
    featureKey: FeatureKey | string,
  ): Promise<void> {
    const enabled = await this.isFeatureEnabledForWorkspace(
      workspaceId,
      featureKey,
    );

    if (!enabled) {
      throw new ForbiddenException(
        `Feature "${featureKey}" is not available for current plan`,
      );
    }
  }

  async isFeatureEnabledForWorkspace(
    workspaceId: string,
    featureKey: FeatureKey | string,
  ): Promise<boolean> {
    return this.repo.isFeatureEnabledForWorkspace(workspaceId, featureKey);
  }
}
