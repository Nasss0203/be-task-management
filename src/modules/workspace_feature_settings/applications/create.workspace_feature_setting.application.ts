import { Inject, Injectable } from '@nestjs/common';
import { CreateWorkspaceFeatureSettingDto } from '../dto/create-workspace_feature_setting.dto';
import { WorkspaceFeatureSettingResponseDto } from '../dto/response/workspace_feature_setting.response.dto';
import { CreateWorkspaceFeatureSettingApplication } from '../interfaces/applications/create.workspace_feature_setting.application.interface';
import { type CreateWorkspaceFeatureSettingService } from '../interfaces/services/create.workspace_feature_setting.service.interface';
import { WORKSPACE_FEATURE_SETTING_TYPES } from '../interfaces/types';
import { WorkspaceFeatureSettingMapper } from '../mapper/workspace_feature_setting.mapper';

@Injectable()
export class CreateWorkspaceFeatureSettingApplicationImpl implements CreateWorkspaceFeatureSettingApplication {
  constructor(
    @Inject(
      WORKSPACE_FEATURE_SETTING_TYPES.services
        .CreateWorkspaceFeatureSettingService,
    )
    private readonly service: CreateWorkspaceFeatureSettingService,
  ) {}

  async create(
    dto: CreateWorkspaceFeatureSettingDto,
  ): Promise<WorkspaceFeatureSettingResponseDto> {
    const model = await this.service.create(dto);

    return WorkspaceFeatureSettingMapper.toResponse(model);
  }
}
