import { Inject, Injectable } from '@nestjs/common';
import { WorkspaceFeatureSettingResponseDto } from '../dto/response/workspace_feature_setting.response.dto';
import { FindWorkspaceFeatureSettingApplication } from '../interfaces/applications/find.workspace_feature_setting.application.interface';
import { type FindWorkspaceFeatureSettingService } from '../interfaces/services/find.workspace_feature_setting.service.interface';
import { WORKSPACE_FEATURE_SETTING_TYPES } from '../interfaces/types';
import { WorkspaceFeatureSettingMapper } from '../mapper/workspace_feature_setting.mapper';

@Injectable()
export class FindWorkspaceFeatureSettingApplicationImpl implements FindWorkspaceFeatureSettingApplication {
  constructor(
    @Inject(
      WORKSPACE_FEATURE_SETTING_TYPES.services
        .FindWorkspaceFeatureSettingService,
    )
    private readonly service: FindWorkspaceFeatureSettingService,
  ) {}

  async findAll(): Promise<WorkspaceFeatureSettingResponseDto[]> {
    const settings = await this.service.findAll();

    return settings.map((setting) =>
      WorkspaceFeatureSettingMapper.toResponse(setting),
    );
  }

  async findById(id: string): Promise<WorkspaceFeatureSettingResponseDto> {
    const setting = await this.service.findById(id);

    return WorkspaceFeatureSettingMapper.toResponse(setting);
  }
}
