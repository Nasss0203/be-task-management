import { Controller, Get, Inject, Param } from '@nestjs/common';
import { Auth } from 'src/common/decorator/auth.decorator';
import { ReadRateLimit } from 'src/common/decorator/rate-limit.decorator';
import { RequirePermissions } from 'src/common/decorator/require-permissions.decorator';
import { ResponseMessage } from 'src/common/decorator/response-message.decorator';
import { WorkspaceContext } from 'src/common/decorator/workspace-context.decorator';
import { PERMISSIONS } from 'src/modules/permission/constants/permission.constant';
import { type IAuth } from 'src/types/auth';
import { GetWorkspaceOverviewResponseDto } from '../dto/response/get-workspace-overview.response.dto';
import { type GetWorkspaceOverviewApplication } from '../interfaces/applications/get-workspace-overview.application.interface';
import { DASHBOARD_TYPES } from '../interfaces/types';

@Controller('dashboard')
@ReadRateLimit()
export class WorkspaceOverviewController {
  constructor(
    @Inject(DASHBOARD_TYPES.applications.GetWorkspaceOverviewApplication)
    private readonly getWorkspaceOverviewApplication: GetWorkspaceOverviewApplication,
  ) {}

  @Get('workspaces/:workspaceId/overview')
  @WorkspaceContext({ source: 'param', key: 'workspaceId' })
  @RequirePermissions(PERMISSIONS.WORKSPACE_READ)
  @ResponseMessage('Get workspace overview')
  async getWorkspaceOverview(
    @Param('workspaceId') workspaceId: string,
    @Auth() auth: IAuth,
  ): Promise<GetWorkspaceOverviewResponseDto> {
    return this.getWorkspaceOverviewApplication.getOverview(
      workspaceId,
      auth.id,
    );
  }
}
