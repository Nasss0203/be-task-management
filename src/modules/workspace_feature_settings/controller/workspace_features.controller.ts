import { Body, Controller, Get, Inject, Param, Patch } from '@nestjs/common';
import { Auth } from 'src/common/decorator/auth.decorator';
import { RequirePermissions } from 'src/common/decorator/require-permissions.decorator';
import { ResponseMessage } from 'src/common/decorator/response-message.decorator';
import { PERMISSIONS } from 'src/modules/permission/constants/permission.constant';
import { type IAuth } from 'src/types/auth';
import { WorkspaceFeatureStatusResponseDto } from '../dto/response/workspace_feature_status.response.dto';
import { UpdateWorkspaceFeatureDto } from '../dto/update-workspace-feature.dto';
import { type WorkspaceFeatureAccessApplication } from '../interfaces/applications/workspace_feature_access.application.interface';
import { WORKSPACE_FEATURE_SETTING_TYPES } from '../interfaces/types';

@Controller('workspaces/:workspaceId/features')
export class WorkspaceFeaturesController {
  constructor(
    @Inject(
      WORKSPACE_FEATURE_SETTING_TYPES.applications
        .WorkspaceFeatureAccessApplication,
    )
    private readonly app: WorkspaceFeatureAccessApplication,
  ) {}

  @Get()
  @RequirePermissions(PERMISSIONS.WORKSPACE_FEATURE_READ)
  @ResponseMessage('Find feature workspace')
  findWorkspaceFeatures(
    @Param('workspaceId') workspaceId: string,
  ): Promise<WorkspaceFeatureStatusResponseDto[]> {
    return this.app.findWorkspaceFeatures(workspaceId);
  }

  @Patch(':featureCode')
  @RequirePermissions(PERMISSIONS.WORKSPACE_FEATURE_UPDATE)
  updateWorkspaceFeature(
    @Param('workspaceId') workspaceId: string,
    @Param('featureCode') featureCode: string,
    @Body() dto: UpdateWorkspaceFeatureDto,
    @Auth() auth: IAuth,
  ): Promise<WorkspaceFeatureStatusResponseDto> {
    return this.app.updateWorkspaceFeature({
      workspaceId,
      featureCode,
      dto,
      userId: auth.id,
    });
  }
}
