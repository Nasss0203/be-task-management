import { Controller, Get, Inject, Param, Query } from '@nestjs/common';
import { ResponseMessage } from 'src/common/decorator/response-message.decorator';
import { WorkspaceResponseDto } from 'src/modules/workspaces/dto/response/workspaces.response.dto';
import { AdminFindAllWorkspaceQueryDto } from 'src/modules/workspaces/dto/search-workspace.dto';
import { AdminService } from '../admin.service';
import { WorkspaceOverviewResponseDto } from '../dto/response/workspace-overview.response.dto';
import { type AdminFindAllWorkspaceApplication } from '../interfaces/applications/admin-findAll-workspace.application.interface';
import { type AdminWorkspaceOverviewApplication } from '../interfaces/applications/workspace-overview.application.interface';
import { ADMIN_TYPES } from '../interfaces/types';

import { WorkspaceMemberSummaryResponseDto } from 'src/modules/workspaces/dto/response/workspace-member-summary.response.dto';
import { type AdminWorkspaceMemberSummaryApplication } from 'src/modules/workspaces/interfaces/applications/admin-workspace-member-summary.application.interface';
import { WORKSPACE_TYPES } from 'src/modules/workspaces/interfaces/types';

@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    @Inject(ADMIN_TYPES.applications.AdminFindAllWorkspaceApplication)
    private readonly adminFindAllWorkspaceApplication: AdminFindAllWorkspaceApplication,

    @Inject(ADMIN_TYPES.applications.AdminWorkspaceOverviewApplication)
    private readonly adminWorkspaceOverviewApplication: AdminWorkspaceOverviewApplication,

    @Inject(WORKSPACE_TYPES.applications.AdminWorkspaceMemberSummaryApplication)
    private readonly adminWorkspaceMemberSummaryApplication: AdminWorkspaceMemberSummaryApplication,
  ) {}

  @Get('findAll-workspaces')
  @ResponseMessage('get all workspaces by admin successfully')
  findAllWorkspace(
    @Query() query: AdminFindAllWorkspaceQueryDto,
  ): Promise<WorkspaceResponseDto[]> {
    return this.adminFindAllWorkspaceApplication.findAllWorkspace(query);
  }

  @Get('findAll-workspaces-overview/:workspaceId')
  @ResponseMessage('Get workspace overview successfully')
  findAllWorkspaceOverview(
    @Param('workspaceId') workspaceId: string,
  ): Promise<WorkspaceOverviewResponseDto> {
    return this.adminWorkspaceOverviewApplication.getOverview(workspaceId);
  }
  @Get('workspaces/:workspaceId/member-summary')
  @ResponseMessage('Get workspace member summary successfully')
  getWorkspaceMemberSummary(
    @Param('workspaceId') workspaceId: string,
  ): Promise<WorkspaceMemberSummaryResponseDto> {
    return this.adminWorkspaceMemberSummaryApplication.getMemberSummary(
      workspaceId,
    );
  }
}
