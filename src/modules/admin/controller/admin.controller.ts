import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Patch,
  Query,
} from '@nestjs/common';
import { Auth } from 'src/common/decorator/auth.decorator';
import { RequireSystemRoles } from 'src/common/decorator/require-system-roles.decorator';
import { ResponseMessage } from 'src/common/decorator/response-message.decorator';
import { type IAuth } from 'src/types/auth';
import { SystemRole } from 'src/modules/users/domain/entities/user.entity';
import { WorkspaceMemberSummaryResponseDto } from 'src/modules/workspaces/dto/response/workspace-member-summary.response.dto';
import { WorkspaceResponseDto } from 'src/modules/workspaces/dto/response/workspaces.response.dto';
import { AdminFindAllWorkspaceQueryDto } from 'src/modules/workspaces/dto/search-workspace.dto';
import { type AdminWorkspaceMemberSummaryApplication } from 'src/modules/workspaces/interfaces/applications/admin-workspace-member-summary.application.interface';
import { WORKSPACE_TYPES } from 'src/modules/workspaces/interfaces/types';
import { AdminService } from '../admin.service';
import { UserGrowthQueryDto } from '../dto/query/dashboard/user-growth-query.dto';
import { WorkspaceGrowthQueryDto } from '../dto/query/dashboard/workspace-growth-query.dto';
import { AdminFindAllUserQueryDto } from '../dto/query/user/admin-user-query.dto';
import { UpdateUserSystemRoleDto } from '../dto/request/user/update-user-system-role.dto';
import { DashboardSummaryResponseDto } from '../dto/response/dashboard/dashboard-summary.response.dto';
import { RecentActivityResponseDto } from '../dto/response/dashboard/recent-activity.response.dto';
import { RetentionMetricResponseDto } from '../dto/response/dashboard/retention-metrics.response.dto';
import { SystemHealthResponseDto } from '../dto/response/dashboard/system-health.response.dto';
import { UpdateWorkspacePlanDto } from '../dto/response/dashboard/update-workspace-plan.dto';
import { UserGrowthResponseDto } from '../dto/response/dashboard/user-growth.response.dto';
import { WorkspaceGrowthResponseDto } from '../dto/response/dashboard/workspace-growth.response.dto';
import {
  AdminWorkspaceOverviewResponseDto,
  PaginatedAdminWorkspaceResponseDto,
} from '../dto/response/dashboard/workspace-overview.response.dto';
import { WorkspacePlanResponseDto } from '../dto/response/dashboard/workspace-plan.response.dto';
import { AdminUserOverviewResponseDto } from '../dto/response/user/admin-user-overview.response.dto';
import { AdminUserResponseDto } from '../dto/response/user/admin-user.response.dto';
import { type AdminDashboardSummaryApplication } from '../interfaces/applications/dashboard/admin-dashboard-summary.application.interface';
import { type AdminRecentActivityApplication } from '../interfaces/applications/dashboard/admin-recent-activity.application.interface';
import { type AdminRetentionMetricsApplication } from '../interfaces/applications/dashboard/admin-retention-metrics.application.interface';
import { type AdminSystemHealthApplication } from '../interfaces/applications/dashboard/admin-system-health.application.interface';
import { type AdminUpdateWorkspacePlanApplication } from '../interfaces/applications/dashboard/admin-update-workspace-plan.application.interface';
import { type AdminUserGrowthApplication } from '../interfaces/applications/dashboard/admin-user-growth.application.interface';
import { type AdminWorkspaceGrowthApplication } from '../interfaces/applications/dashboard/admin-workspace-growth.application.interface';
import { type AdminWorkspacePlanApplication } from '../interfaces/applications/dashboard/admin-workspace-plan.application.interface';
import { type AdminWorkspaceOverviewApplication } from '../interfaces/applications/dashboard/workspace-overview.application.interface';
import { type AdminUserApplication } from '../interfaces/applications/user/admin-user.application.interface';
import { type AdminUserOverviewApplication } from '../interfaces/applications/user/admin-user-overview.application.interface';
import { type AdminFindAllWorkspaceApplication } from '../interfaces/applications/workspace/admin-findAll-workspace.application.interface';
import { ADMIN_TYPES } from '../interfaces/types';

@RequireSystemRoles(SystemRole.SYSTEM_ADMIN, SystemRole.SUPER_ADMIN)
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
    @Inject(ADMIN_TYPES.applications.AdminWorkspaceGrowthApplication)
    private readonly adminWorkspaceGrowthApplication: AdminWorkspaceGrowthApplication,
    @Inject(ADMIN_TYPES.applications.AdminWorkspacePlanApplication)
    private readonly adminWorkspacePlanApplication: AdminWorkspacePlanApplication,
    @Inject(ADMIN_TYPES.applications.AdminRetentionMetricsApplication)
    private readonly adminRetentionMetricsApplication: AdminRetentionMetricsApplication,
    @Inject(ADMIN_TYPES.applications.AdminSystemHealthApplication)
    private readonly adminSystemHealthApplication: AdminSystemHealthApplication,
    @Inject(ADMIN_TYPES.applications.AdminRecentActivityApplication)
    private readonly adminRecentActivityApplication: AdminRecentActivityApplication,
    @Inject(ADMIN_TYPES.applications.AdminUserOverviewApplication)
    private readonly adminUserOverviewApplication: AdminUserOverviewApplication,
    @Inject(ADMIN_TYPES.applications.AdminUserApplication)
    private readonly adminUserApplication: AdminUserApplication,
  ) {}

  @Get('findAll-workspaces')
  @ResponseMessage('get all workspaces by admin successfully')
  findAllWorkspace(
    @Query() query: AdminFindAllWorkspaceQueryDto,
  ): Promise<PaginatedAdminWorkspaceResponseDto> {
    return this.adminFindAllWorkspaceApplication.findAllWorkspace(query);
  }

  @Get('findAll-workspaces-overview/:workspaceId')
  @ResponseMessage('Get workspace overview successfully')
  getWorkspaceOverview(
    @Param('workspaceId') workspaceId: string,
  ): Promise<AdminWorkspaceOverviewResponseDto> {
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

  @Get('dashboard/workspace-growth')
  @ResponseMessage('Get workspace growth successfully')
  getWorkspaceGrowth(
    @Query() query: WorkspaceGrowthQueryDto,
  ): Promise<WorkspaceGrowthResponseDto[]> {
    return this.adminWorkspaceGrowthApplication.getWorkspaceGrowth(query);
  }

  @Get('dashboard/workspace-plan')
  @ResponseMessage('Get workspace plan distribution successfully')
  getWorkspacePlan(): Promise<WorkspacePlanResponseDto[]> {
    return this.adminWorkspacePlanApplication.getWorkspacePlan();
  }

  @Get('dashboard/retention-metrics')
  @ResponseMessage('Get retention metrics successfully')
  getRetentionMetrics(): Promise<RetentionMetricResponseDto[]> {
    return this.adminRetentionMetricsApplication.getRetentionMetrics();
  }

  @Get('dashboard/system-health')
  @ResponseMessage('Get system health successfully')
  getSystemHealth(): Promise<SystemHealthResponseDto[]> {
    return this.adminSystemHealthApplication.getSystemHealth();
  }

  @Get('dashboard/recent-activities')
  @ResponseMessage('Get recent activities successfully')
  getRecentActivities(): Promise<RecentActivityResponseDto[]> {
    return this.adminRecentActivityApplication.getRecentActivities();
  }

  @Get('users/overview')
  @ResponseMessage('Get admin user overview successfully')
  getUserOverview(): Promise<AdminUserOverviewResponseDto> {
    return this.adminUserOverviewApplication.getOverview();
  }

  @Get('users')
  @ResponseMessage('Get admin users successfully')
  findAllUsers(
    @Query() query: AdminFindAllUserQueryDto,
  ): Promise<AdminUserResponseDto[]> {
    return this.adminUserApplication.findAll(query);
  }

  @Patch('users/:userId/lock')
  @ResponseMessage('Lock user successfully')
  lockUser(
    @Param('userId') userId: string,
    @Auth() auth: IAuth,
  ): Promise<void> {
    return this.adminUserApplication.lockUser(userId, auth.id, auth.systemRole);
  }

  @Patch('users/:userId/unlock')
  @ResponseMessage('Unlock user successfully')
  unlockUser(
    @Param('userId') userId: string,
    @Auth() auth: IAuth,
  ): Promise<void> {
    return this.adminUserApplication.unlockUser(
      userId,
      auth.id,
      auth.systemRole,
    );
  }

  @Patch('users/:userId/system-role')
  @ResponseMessage('Update user system role successfully')
  updateUserSystemRole(
    @Param('userId') userId: string,
    @Body() dto: UpdateUserSystemRoleDto,
    @Auth() auth: IAuth,
  ): Promise<void> {
    return this.adminUserApplication.updateSystemRole(
      userId,
      dto,
      auth.id,
      auth.systemRole,
    );
  }
}
