import { Inject, Injectable } from '@nestjs/common';
import { WorkspaceFeatureSettingResponseDto } from '../dto/response/workspace_feature_setting.response.dto';
import { UpdateWorkspaceFeatureSettingDto } from '../dto/update-workspace_feature_setting.dto';
import { UpdateWorkspaceFeatureSettingApplication } from '../interfaces/applications/update.workspace_feature_setting.application.interface';
import { type UpdateWorkspaceFeatureSettingService } from '../interfaces/services/update.workspace_feature_setting.service.interface';
import { WORKSPACE_FEATURE_SETTING_TYPES } from '../interfaces/types';
import { WorkspaceFeatureSettingMapper } from '../mapper/workspace_feature_setting.mapper';

@Injectable()
export class UpdateWorkspaceFeatureSettingApplicationImpl implements UpdateWorkspaceFeatureSettingApplication {
  constructor(
    @Inject(
      WORKSPACE_FEATURE_SETTING_TYPES.services
        .UpdateWorkspaceFeatureSettingService,
    )
    private readonly service: UpdateWorkspaceFeatureSettingService,
  ) {}

  async update(
    id: string,
    dto: UpdateWorkspaceFeatureSettingDto,
  ): Promise<WorkspaceFeatureSettingResponseDto> {
    const setting = await this.service.update(id, dto);

    return WorkspaceFeatureSettingMapper.toResponse(setting);
  }
}
