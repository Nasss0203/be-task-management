import { Module } from '@nestjs/common';

import { ADMIN_TYPES } from './admin.types';
import { CreateAdminBillingPlanPriceVersionHandler } from './application/commands/create-admin-billing-plan-price-version/create-admin-billing-plan-price-version.handler';
import { UpdateAdminBillingPlanHandler } from './application/commands/update-admin-billing-plan/update-admin-billing-plan.handler';
import { UpdateAdminUserRoleHandler } from './application/commands/update-admin-user-role/update-admin-user-role.handler';
import { UpdateAdminUserStatusHandler } from './application/commands/update-admin-user-status/update-admin-user-status.handler';
import { GetAdminAccessHandler } from './application/queries/get-admin-access/get-admin-access.handler';
import { GetAdminBillingOverviewHandler } from './application/queries/get-admin-billing-overview/get-admin-billing-overview.handler';
import { GetAdminBillingPlanHandler } from './application/queries/get-admin-billing-plan/get-admin-billing-plan.handler';
import { GetAdminDashboardOverviewHandler } from './application/queries/get-admin-dashboard-overview/get-admin-dashboard-overview.handler';
import { GetAdminUserHandler } from './application/queries/get-admin-user/get-admin-user.handler';
import { GetAdminWorkspaceHandler } from './application/queries/get-admin-workspace/get-admin-workspace.handler';
import { ListAdminBillingPaymentOrdersHandler } from './application/queries/list-admin-billing-payment-orders/list-admin-billing-payment-orders.handler';
import { ListAdminBillingPlansHandler } from './application/queries/list-admin-billing-plans/list-admin-billing-plans.handler';
import { ListAdminBillingSubscriptionsHandler } from './application/queries/list-admin-billing-subscriptions/list-admin-billing-subscriptions.handler';
import { ListAdminBillingWebhookEventsHandler } from './application/queries/list-admin-billing-webhook-events/list-admin-billing-webhook-events.handler';
import { ListAdminUsersHandler } from './application/queries/list-admin-users/list-admin-users.handler';
import { ListAdminWorkspaceMembersHandler } from './application/queries/list-admin-workspace-members/list-admin-workspace-members.handler';
import { ListAdminWorkspacePagesHandler } from './application/queries/list-admin-workspace-pages/list-admin-workspace-pages.handler';
import { ListAdminWorkspacesHandler } from './application/queries/list-admin-workspaces/list-admin-workspaces.handler';
import { ListAdminWorkspaceTeamspacesHandler } from './application/queries/list-admin-workspace-teamspaces/list-admin-workspace-teamspaces.handler';
import { AdminAuthorizationService } from './application/services/admin-authorization.service';
import { TypeOrmAdminBillingPlanReader } from './infrastructure/persistence/typeorm/readers/typeorm-admin-billing-plan.reader';
import { TypeOrmAdminBillingReader } from './infrastructure/persistence/typeorm/readers/typeorm-admin-billing.reader';
import { TypeOrmAdminBillingWebhookReader } from './infrastructure/persistence/typeorm/readers/typeorm-admin-billing-webhook.reader';
import { TypeOrmAdminDashboardReader } from './infrastructure/persistence/typeorm/readers/typeorm-admin-dashboard.reader';
import { TypeOrmAdminUserReader } from './infrastructure/persistence/typeorm/readers/typeorm-admin-user.reader';
import { TypeOrmAdminWorkspaceReader } from './infrastructure/persistence/typeorm/readers/typeorm-admin-workspace.reader';
import { TypeOrmAdminBillingPlanWriter } from './infrastructure/persistence/typeorm/writers/typeorm-admin-billing-plan.writer';
import { TypeOrmAdminUserWriter } from './infrastructure/persistence/typeorm/writers/typeorm-admin-user.writer';
import { AdminAccessController } from './presentation/http/controllers/admin-access.controller';
import { AdminBillingController } from './presentation/http/controllers/admin-billing.controller';
import { AdminDashboardController } from './presentation/http/controllers/admin-dashboard.controller';
import { AdminUsersController } from './presentation/http/controllers/admin-users.controller';
import { AdminWorkspacesController } from './presentation/http/controllers/admin-workspaces.controller';
import { AdminPermissionGuard } from './presentation/http/guards/admin-permission.guard';

@Module({
  controllers: [
    AdminAccessController,
    AdminUsersController,
    AdminWorkspacesController,
    AdminDashboardController,
    AdminBillingController,
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
      provide: ADMIN_TYPES.ports.DashboardReader,
      useClass: TypeOrmAdminDashboardReader,
    },
    {
      provide: ADMIN_TYPES.ports.BillingReader,
      useClass: TypeOrmAdminBillingReader,
    },
    {
      provide: ADMIN_TYPES.ports.BillingWebhookReader,
      useClass: TypeOrmAdminBillingWebhookReader,
    },
    {
      provide: ADMIN_TYPES.ports.BillingPlanReader,
      useClass: TypeOrmAdminBillingPlanReader,
    },
    {
      provide: ADMIN_TYPES.ports.BillingPlanWriter,
      useClass: TypeOrmAdminBillingPlanWriter,
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
      provide: ADMIN_TYPES.applications.UpdateAdminUserRoleHandler,
      useClass: UpdateAdminUserRoleHandler,
    },
    {
      provide: ADMIN_TYPES.applications.UpdateAdminUserStatusHandler,
      useClass: UpdateAdminUserStatusHandler,
    },
    {
      provide: ADMIN_TYPES.applications.ListAdminWorkspacesHandler,
      useClass: ListAdminWorkspacesHandler,
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
      provide: ADMIN_TYPES.applications.GetAdminDashboardOverviewHandler,
      useClass: GetAdminDashboardOverviewHandler,
    },
    {
      provide: ADMIN_TYPES.applications.GetAdminBillingOverviewHandler,
      useClass: GetAdminBillingOverviewHandler,
    },
    {
      provide: ADMIN_TYPES.applications.ListAdminBillingSubscriptionsHandler,
      useClass: ListAdminBillingSubscriptionsHandler,
    },
    {
      provide: ADMIN_TYPES.applications.ListAdminBillingPaymentOrdersHandler,
      useClass: ListAdminBillingPaymentOrdersHandler,
    },
    {
      provide: ADMIN_TYPES.applications.ListAdminBillingWebhookEventsHandler,
      useClass: ListAdminBillingWebhookEventsHandler,
    },
    {
      provide: ADMIN_TYPES.applications.ListAdminBillingPlansHandler,
      useClass: ListAdminBillingPlansHandler,
    },
    {
      provide: ADMIN_TYPES.applications.GetAdminBillingPlanHandler,
      useClass: GetAdminBillingPlanHandler,
    },
    {
      provide: ADMIN_TYPES.applications.UpdateAdminBillingPlanHandler,
      useClass: UpdateAdminBillingPlanHandler,
    },
    {
      provide:
        ADMIN_TYPES.applications.CreateAdminBillingPlanPriceVersionHandler,
      useClass: CreateAdminBillingPlanPriceVersionHandler,
    },
    {
      provide: ADMIN_TYPES.services.AdminAuthorizationService,
      useClass: AdminAuthorizationService,
    },
    AdminPermissionGuard,
  ],
})
export class AdminModule {}
