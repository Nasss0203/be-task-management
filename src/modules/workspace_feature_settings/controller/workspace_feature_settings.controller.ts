import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import {
  AdminRateLimit,
  WriteRateLimit,
} from 'src/common/decorator/rate-limit.decorator';
import { RequireSystemRoles } from 'src/common/decorator/require-system-roles.decorator';
import { SystemRole } from 'src/modules/users/domain/entities/user.entity';
import { CreateWorkspaceFeatureSettingDto } from '../dto/create-workspace_feature_setting.dto';
import { WorkspaceFeatureSettingResponseDto } from '../dto/response/workspace_feature_setting.response.dto';
import { UpdateWorkspaceFeatureSettingDto } from '../dto/update-workspace_feature_setting.dto';
import { type CreateWorkspaceFeatureSettingApplication } from '../interfaces/applications/create.workspace_feature_setting.application.interface';
import { type DeleteWorkspaceFeatureSettingApplication } from '../interfaces/applications/delete.workspace_feature_setting.application.interface';
import { type FindWorkspaceFeatureSettingApplication } from '../interfaces/applications/find.workspace_feature_setting.application.interface';
import { type UpdateWorkspaceFeatureSettingApplication } from '../interfaces/applications/update.workspace_feature_setting.application.interface';
import { WORKSPACE_FEATURE_SETTING_TYPES } from '../interfaces/types';

@Controller('workspace-feature-settings')
@RequireSystemRoles(SystemRole.SYSTEM_ADMIN, SystemRole.SUPER_ADMIN)
@AdminRateLimit()
export class WorkspaceFeatureSettingsController {
  constructor(
    @Inject(
      WORKSPACE_FEATURE_SETTING_TYPES.applications
        .CreateWorkspaceFeatureSettingApplication,
    )
    private readonly createApplication: CreateWorkspaceFeatureSettingApplication,

    @Inject(
      WORKSPACE_FEATURE_SETTING_TYPES.applications
        .FindWorkspaceFeatureSettingApplication,
    )
    private readonly findApplication: FindWorkspaceFeatureSettingApplication,

    @Inject(
      WORKSPACE_FEATURE_SETTING_TYPES.applications
        .UpdateWorkspaceFeatureSettingApplication,
    )
    private readonly updateApplication: UpdateWorkspaceFeatureSettingApplication,

    @Inject(
      WORKSPACE_FEATURE_SETTING_TYPES.applications
        .DeleteWorkspaceFeatureSettingApplication,
    )
    private readonly deleteApplication: DeleteWorkspaceFeatureSettingApplication,
  ) {}

  @Post()
  @WriteRateLimit()
  create(
    @Body() createDto: CreateWorkspaceFeatureSettingDto,
  ): Promise<WorkspaceFeatureSettingResponseDto> {
    return this.createApplication.create(createDto);
  }

  @Get()
  findAll(): Promise<WorkspaceFeatureSettingResponseDto[]> {
    return this.findApplication.findAll();
  }

  @Get(':id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<WorkspaceFeatureSettingResponseDto> {
    return this.findApplication.findById(id);
  }

  @Patch(':id')
  @WriteRateLimit()
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateWorkspaceFeatureSettingDto,
  ): Promise<WorkspaceFeatureSettingResponseDto> {
    return this.updateApplication.update(id, updateDto);
  }

  @Delete(':id')
  @WriteRateLimit()
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.deleteApplication.delete(id);

    return {
      success: true,
    };
  }
}
