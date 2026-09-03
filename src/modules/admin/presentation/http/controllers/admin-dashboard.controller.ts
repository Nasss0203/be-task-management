import { Controller, Get, Inject, UseGuards } from '@nestjs/common';

import { AdminRateLimit } from 'src/common/decorator/rate-limit.decorator';
import { RequireSystemRoles } from 'src/common/decorator/require-system-roles.decorator';
import { ResponseMessage } from 'src/common/decorator/response-message.decorator';
import { SystemRole } from 'src/modules/identity/identity.types';

import { ADMIN_TYPES } from '../../../admin.types';
import { AdminDashboardOverviewResponseDto } from '../../../application/dto/response/admin-dashboard-overview.response.dto';
import { GetAdminDashboardOverviewHandler } from '../../../application/queries/get-admin-dashboard-overview/get-admin-dashboard-overview.handler';
import { GetAdminDashboardOverviewQuery } from '../../../application/queries/get-admin-dashboard-overview/get-admin-dashboard-overview.query';
import { ADMIN_PERMISSIONS } from '../../../domain/permissions/admin-permission-code';
import { RequireAdminPermissions } from '../decorators/require-admin-permissions.decorator';
import { AdminPermissionGuard } from '../guards/admin-permission.guard';

@Controller('admin/dashboard')
@UseGuards(AdminPermissionGuard)
export class AdminDashboardController {
  constructor(
    @Inject(ADMIN_TYPES.applications.GetAdminDashboardOverviewHandler)
    private readonly getAdminDashboardOverviewHandler: GetAdminDashboardOverviewHandler,
  ) {}

  @Get('overview')
  @AdminRateLimit()
  @RequireSystemRoles(SystemRole.SYSTEM_ADMIN, SystemRole.SUPER_ADMIN)
  @RequireAdminPermissions(ADMIN_PERMISSIONS.DASHBOARD_READ)
  @ResponseMessage('Get admin dashboard overview successfully')
  getOverview(): Promise<AdminDashboardOverviewResponseDto> {
    return this.getAdminDashboardOverviewHandler.execute(
      new GetAdminDashboardOverviewQuery(),
    );
  }
}
