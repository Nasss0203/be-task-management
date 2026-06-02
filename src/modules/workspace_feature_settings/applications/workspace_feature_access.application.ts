import { Inject, Injectable } from '@nestjs/common';
import { WorkspaceFeatureStatusResponseDto } from '../dto/response/workspace_feature_status.response.dto';
import { UpdateWorkspaceFeatureDto } from '../dto/update-workspace-feature.dto';
import { WorkspaceFeatureAccessApplication } from '../interfaces/applications/workspace_feature_access.application.interface';
import { type WorkspaceFeatureAccessService } from '../interfaces/services/workspace_feature_access.service.interface';
import { WORKSPACE_FEATURE_SETTING_TYPES } from '../interfaces/types';
import { WorkspaceFeatureStatusMapper } from '../mapper/workspace_feature_status.mapper';

@Injectable()
export class WorkspaceFeatureAccessApplicationImpl
  implements WorkspaceFeatureAccessApplication
{
  constructor(
    @Inject(
      WORKSPACE_FEATURE_SETTING_TYPES.services.WorkspaceFeatureAccessService,
    )
    private readonly service: WorkspaceFeatureAccessService,
  ) {}

  async findWorkspaceFeatures(
    workspaceId: string,
  ): Promise<WorkspaceFeatureStatusResponseDto[]> {
    const features = await this.service.findWorkspaceFeatures(workspaceId);

    return features.map((feature) =>
      WorkspaceFeatureStatusMapper.toResponse(feature),
    );
  }

  async updateWorkspaceFeature(input: {
    workspaceId: string;
    featureCode: string;
    dto: UpdateWorkspaceFeatureDto;
    userId: string;
  }): Promise<WorkspaceFeatureStatusResponseDto> {
    const feature = await this.service.updateWorkspaceFeature({
      workspaceId: input.workspaceId,
      featureCode: input.featureCode,
      enabled: input.dto.enabled,
      userId: input.userId,
    });

    return WorkspaceFeatureStatusMapper.toResponse(feature);
  }
}
