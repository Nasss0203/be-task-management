import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Patch,
  Query,
} from '@nestjs/common';
import { ResponseMessage } from 'src/common/decorator/response-message.decorator';
import { WorkspaceResponseDto } from 'src/modules/workspaces/dto/response/workspaces.response.dto';
import { AdminFindAllWorkspaceQueryDto } from 'src/modules/workspaces/dto/search-workspace.dto';
import { AdminService } from '../admin.service';
import {
  AdminWorkspaceItemResponseDto,
  WorkspaceOverviewResponseDto,
} from '../dto/response/workspace-overview.response.dto';
import { type AdminFindAllWorkspaceApplication } from '../interfaces/applications/admin-findAll-workspace.application.interface';
import { type AdminWorkspaceOverviewApplication } from '../interfaces/applications/workspace-overview.application.interface';
import { ADMIN_TYPES } from '../interfaces/types';

import { WorkspaceMemberSummaryResponseDto } from 'src/modules/workspaces/dto/response/workspace-member-summary.response.dto';
import { type AdminWorkspaceMemberSummaryApplication } from 'src/modules/workspaces/interfaces/applications/admin-workspace-member-summary.application.interface';
import { WORKSPACE_TYPES } from 'src/modules/workspaces/interfaces/types';
import { DashboardSummaryResponseDto } from '../dto/response/dashboard-summary.response.dto';
import { UserGrowthResponseDto } from '../dto/response/user-growth.response.dto';
import { UpdateWorkspacePlanDto } from '../dto/update-workspace-plan.dto';
import { type AdminDashboardSummaryApplication } from '../interfaces/applications/admin-dashboard-summary.application.interface';
import { type AdminUpdateWorkspacePlanApplication } from '../interfaces/applications/admin-update-workspace-plan.application.interface';
import { type AdminUserGrowthApplication } from '../interfaces/applications/admin-user-growth.application.interface';
import { UserGrowthQueryDto } from '../dto/query/user-growth-query.dto';

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

    @Inject(ADMIN_TYPES.applications.AdminUpdateWorkspacePlanApplication)
    private readonly adminUpdateWorkspacePlanApplication: AdminUpdateWorkspacePlanApplication,

    @Inject(ADMIN_TYPES.applications.AdminDashboardSummaryApplication)
    private readonly adminDashboardSummaryApplication: AdminDashboardSummaryApplication,

    @Inject(ADMIN_TYPES.applications.AdminUserGrowthApplication)
    private readonly adminUserGrowthApplication: AdminUserGrowthApplication,
  ) {}

  @Get('findAll-workspaces')
  @ResponseMessage('get all workspaces by admin successfully')
  findAllWorkspace(
    @Query() query: AdminFindAllWorkspaceQueryDto,
  ): Promise<AdminWorkspaceItemResponseDto[]> {
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

  @Patch('workspaces/:workspaceId/plan')
  @ResponseMessage('Update workspace plan successfully')
  updateWorkspacePlan(
    @Param('workspaceId') workspaceId: string,
    @Body() dto: UpdateWorkspacePlanDto,
  ): Promise<WorkspaceResponseDto> {
    console.log('Received update plan request for workspaceId:', dto);
    return this.adminUpdateWorkspacePlanApplication.updatePlan(
      workspaceId,
      dto,
    );
  }
  @Get('dashboard/summary')
  @ResponseMessage('Get admin dashboard summary successfully')
  getDashboardSummary(): Promise<DashboardSummaryResponseDto> {
    return this.adminDashboardSummaryApplication.getSummary();
  }
  @Get('dashboard/user-growth')
  @ResponseMessage('Get user growth successfully')
  getUserGrowth(
    @Query() query: UserGrowthQueryDto,
  ): Promise<UserGrowthResponseDto[]> {
    return this.adminUserGrowthApplication.getUserGrowth(query);
  }
}
