import { Module } from '@nestjs/common';
import { ADMIN_TYPES } from './admin.types';
import { UpdateAdminUserStatusHandler } from './application/commands/update-admin-user-status/update-admin-user-status.handler';
import { GetAdminAccessHandler } from './application/queries/get-admin-access/get-admin-access.handler';
import { GetAdminUserHandler } from './application/queries/get-admin-user/get-admin-user.handler';
import { ListAdminUsersHandler } from './application/queries/list-admin-users/list-admin-users.handler';
import { AdminAuthorizationService } from './application/services/admin-authorization.service';
import { TypeOrmAdminUserReader } from './infrastructure/persistence/typeorm/readers/typeorm-admin-user.reader';
import { TypeOrmAdminUserWriter } from './infrastructure/persistence/typeorm/writers/typeorm-admin-user.writer';
import { AdminAccessController } from './presentation/http/controllers/admin-access.controller';
import { AdminUsersController } from './presentation/http/controllers/admin-users.controller';
import { AdminPermissionGuard } from './presentation/http/guards/admin-permission.guard';
import { UpdateAdminUserRoleHandler } from './application/commands/update-admin-user-role/update-admin-user-role.handler';
import { ListAdminWorkspacesHandler } from './application/queries/list-admin-workspaces/list-admin-workspaces.handler';
import { TypeOrmAdminWorkspaceReader } from './infrastructure/persistence/typeorm/readers/typeorm-admin-workspace.reader';
import { AdminWorkspacesController } from './presentation/http/controllers/admin-workspaces.controller';
import { GetAdminWorkspaceHandler } from './application/queries/get-admin-workspace/get-admin-workspace.handler';
import { ListAdminWorkspaceMembersHandler } from './application/queries/list-admin-workspace-members/list-admin-workspace-members.handler';
import { ListAdminWorkspaceTeamspacesHandler } from './application/queries/list-admin-workspace-teamspaces/list-admin-workspace-teamspaces.handler';
import { ListAdminWorkspacePagesHandler } from './application/queries/list-admin-workspace-pages/list-admin-workspace-pages.handler';
import { GetAdminDashboardOverviewHandler } from './application/queries/get-admin-dashboard-overview/get-admin-dashboard-overview.handler';
import { TypeOrmAdminDashboardReader } from './infrastructure/persistence/typeorm/readers/typeorm-admin-dashboard.reader';
import { AdminDashboardController } from './presentation/http/controllers/admin-dashboard.controller';

@Module({
  controllers: [
    AdminAccessController,
    AdminUsersController,
    AdminWorkspacesController,
    AdminDashboardController,
  ],
  providers: [
    {
      provide: ADMIN_TYPES.ports.UserReader,
      useClass: TypeOrmAdminUserReader,
    },
    {
      provide: ADMIN_TYPES.ports.WorkspaceReader,
      useClass: TypeOrmAdminWorkspaceReader,
    },
    {
      provide: ADMIN_TYPES.ports.UserWriter,
      useClass: TypeOrmAdminUserWriter,
    },
    {
      provide: ADMIN_TYPES.applications.GetAdminAccessHandler,
      useClass: GetAdminAccessHandler,
    },
    {
      provide: ADMIN_TYPES.applications.GetAdminUserHandler,
      useClass: GetAdminUserHandler,
    },
    {
      provide: ADMIN_TYPES.applications.ListAdminUsersHandler,
      useClass: ListAdminUsersHandler,
    },
    {
      provide: ADMIN_TYPES.applications.ListAdminWorkspacesHandler,
      useClass: ListAdminWorkspacesHandler,
    },
    {
      provide: ADMIN_TYPES.applications.UpdateAdminUserRoleHandler,
      useClass: UpdateAdminUserRoleHandler,
    },
    {
      provide: ADMIN_TYPES.applications.UpdateAdminUserStatusHandler,
      useClass: UpdateAdminUserStatusHandler,
    },
    {
      provide: ADMIN_TYPES.services.AdminAuthorizationService,
      useClass: AdminAuthorizationService,
    },
    {
      provide: ADMIN_TYPES.applications.GetAdminWorkspaceHandler,
      useClass: GetAdminWorkspaceHandler,
    },
    {
      provide: ADMIN_TYPES.applications.ListAdminWorkspaceMembersHandler,
      useClass: ListAdminWorkspaceMembersHandler,
    },
    {
      provide: ADMIN_TYPES.applications.ListAdminWorkspaceTeamspacesHandler,
      useClass: ListAdminWorkspaceTeamspacesHandler,
    },
    {
      provide: ADMIN_TYPES.applications.ListAdminWorkspacePagesHandler,
      useClass: ListAdminWorkspacePagesHandler,
    },
    {
      provide: ADMIN_TYPES.ports.DashboardReader,
      useClass: TypeOrmAdminDashboardReader,
    },
    {
      provide: ADMIN_TYPES.applications.GetAdminDashboardOverviewHandler,
      useClass: GetAdminDashboardOverviewHandler,
    },
    AdminPermissionGuard,
  ],
})
export class AdminModule {}
