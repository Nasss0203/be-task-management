import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { WorkspaceFeatureStatusModel } from '../domain/models/workspace_feature_status.model';
import { type WorkspaceFeatureAccessRepository } from '../interfaces/repositories/workspace_feature_access.repository.interface';
import { WorkspaceFeatureAccessService } from '../interfaces/services/workspace_feature_access.service.interface';
import { WORKSPACE_FEATURE_SETTING_TYPES } from '../interfaces/types';

@Injectable()
export class WorkspaceFeatureAccessServiceImpl
  implements WorkspaceFeatureAccessService
{
  constructor(
    @Inject(
      WORKSPACE_FEATURE_SETTING_TYPES.repositories
        .WorkspaceFeatureAccessRepository,
    )
    private readonly repo: WorkspaceFeatureAccessRepository,
  ) {}

  findWorkspaceFeatures(
    workspaceId: string,
  ): Promise<WorkspaceFeatureStatusModel[]> {
    return this.repo.findWorkspaceFeatures(workspaceId);
  }

  async updateWorkspaceFeature(input: {
    workspaceId: string;
    featureCode: string;
    enabled: boolean;
    userId: string;
  }): Promise<WorkspaceFeatureStatusModel> {
    try {
      return await this.repo.upsertWorkspaceFeatureSetting(input);
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === 'Feature is not available for current plan'
      ) {
        throw new ForbiddenException(
          `Feature "${input.featureCode}" is not available for current plan`,
        );
      }

      throw error;
    }
  }
}
