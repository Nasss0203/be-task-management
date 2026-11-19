import { Module } from '@nestjs/common';

import { BillingModule } from '../billing/billing.module';
import { MarketplaceModule } from '../marketplace/marketplace.module';
import { ADMIN_TYPES } from './admin.types';
import { CreateAdminBillingPlanPriceVersionHandler } from './application/commands/create-admin-billing-plan-price-version/create-admin-billing-plan-price-version.handler';
import { UpdateAdminBillingPlanHandler } from './application/commands/update-admin-billing-plan/update-admin-billing-plan.handler';
import { UpdateAdminUserRoleHandler } from './application/commands/update-admin-user-role/update-admin-user-role.handler';
import { UpdateAdminUserStatusHandler } from './application/commands/update-admin-user-status/update-admin-user-status.handler';
import { GetAdminAccessHandler } from './application/queries/get-admin-access/get-admin-access.handler';
import { ListAdminAccessRolesHandler } from './application/queries/list-admin-access-roles/list-admin-access-roles.handler';
import { GetAdminBillingOverviewHandler } from './application/queries/get-admin-billing-overview/get-admin-billing-overview.handler';
import { GetAdminBillingPlanHandler } from './application/queries/get-admin-billing-plan/get-admin-billing-plan.handler';
import { GetAdminDashboardOverviewHandler } from './application/queries/get-admin-dashboard-overview/get-admin-dashboard-overview.handler';
import { GetAdminUserHandler } from './application/queries/get-admin-user/get-admin-user.handler';
import { GetAdminWorkspaceHandler } from './application/queries/get-admin-workspace/get-admin-workspace.handler';
import { GetAdminWorkspaceUsageHandler } from './application/queries/get-admin-workspace-usage/get-admin-workspace-usage.handler';
import { ListAdminBillingPaymentOrdersHandler } from './application/queries/list-admin-billing-payment-orders/list-admin-billing-payment-orders.handler';
import { ListAdminBillingPlansHandler } from './application/queries/list-admin-billing-plans/list-admin-billing-plans.handler';
import { ListAdminBillingSubscriptionsHandler } from './application/queries/list-admin-billing-subscriptions/list-admin-billing-subscriptions.handler';
import { ListAdminBillingWebhookEventsHandler } from './application/queries/list-admin-billing-webhook-events/list-admin-billing-webhook-events.handler';
import { ListAdminUsersHandler } from './application/queries/list-admin-users/list-admin-users.handler';
import { ListAdminWorkspaceMembersHandler } from './application/queries/list-admin-workspace-members/list-admin-workspace-members.handler';
import { ListAdminWorkspacePagesHandler } from './application/queries/list-admin-workspace-pages/list-admin-workspace-pages.handler';
import { ListAdminWorkspaceTeamspacesHandler } from './application/queries/list-admin-workspace-teamspaces/list-admin-workspace-teamspaces.handler';
import { ListAdminWorkspacesHandler } from './application/queries/list-admin-workspaces/list-admin-workspaces.handler';
import { AdminAuthorizationService } from './application/services/admin-authorization.service';
import { TypeOrmAdminBillingPlanReader } from './infrastructure/persistence/typeorm/readers/typeorm-admin-billing-plan.reader';
import { TypeOrmAdminBillingWebhookReader } from './infrastructure/persistence/typeorm/readers/typeorm-admin-billing-webhook.reader';
import { TypeOrmAdminBillingReader } from './infrastructure/persistence/typeorm/readers/typeorm-admin-billing.reader';
import { TypeOrmAdminDashboardReader } from './infrastructure/persistence/typeorm/readers/typeorm-admin-dashboard.reader';
import { TypeOrmAdminUserReader } from './infrastructure/persistence/typeorm/readers/typeorm-admin-user.reader';
import { TypeOrmAdminWorkspaceReader } from './infrastructure/persistence/typeorm/readers/typeorm-admin-workspace.reader';
import { TypeOrmAdminBillingPlanWriter } from './infrastructure/persistence/typeorm/writers/typeorm-admin-billing-plan.writer';
import { TypeOrmAdminUserWriter } from './infrastructure/persistence/typeorm/writers/typeorm-admin-user.writer';
import { AdminAccessController } from './presentation/http/controllers/admin-access.controller';
import { AdminBillingController } from './presentation/http/controllers/admin-billing.controller';
import { AdminDashboardController } from './presentation/http/controllers/admin-dashboard.controller';
import { AdminTemplateCategoryController } from './presentation/http/controllers/admin-template-category.controller';
import { AdminUsersController } from './presentation/http/controllers/admin-users.controller';
import { AdminWorkspacesController } from './presentation/http/controllers/admin-workspaces.controller';
import { AdminPermissionGuard } from './presentation/http/guards/admin-permission.guard';

import { AdminTemplatePurchaseController } from './presentation/http/controllers/admin-template-purchase.controller';
import { AdminMarketplaceCommissionController } from './presentation/http/controllers/admin-marketplace-commission.controller';
import { AdminMarketplaceSalesController } from './presentation/http/controllers/admin-marketplace-sales.controller';
import { TypeOrmAdminMarketplaceSalesReader } from './infrastructure/persistence/typeorm/readers/typeorm-admin-marketplace-sales.reader';
import { GetAdminMarketplaceSalesOverviewHandler } from './application/queries/get-admin-marketplace-sales-overview/get-admin-marketplace-sales-overview.handler';
import { ListAdminMarketplaceSalesHandler } from './application/queries/list-admin-marketplace-sales/list-admin-marketplace-sales.handler';
import { AdminTemplatesController } from './presentation/http/controllers/admin-templates.controller';
import { TypeOrmAdminTemplateReader } from './infrastructure/persistence/typeorm/readers/typeorm-admin-template.reader';
import { GetAdminTemplatesOverviewHandler } from './application/queries/get-admin-templates-overview/get-admin-templates-overview.handler';
import { ListAdminTemplatesHandler } from './application/queries/list-admin-templates/list-admin-templates.handler';
import { AdminPublishedSitesController } from './presentation/http/controllers/admin-published-sites.controller';
import { TypeOrmAdminPublishedSiteReader } from './infrastructure/persistence/typeorm/readers/typeorm-admin-published-site.reader';
import { GetAdminPublishedSitesOverviewHandler } from './application/queries/get-admin-published-sites-overview/get-admin-published-sites-overview.handler';
import { ListAdminPublishedSitesHandler } from './application/queries/list-admin-published-sites/list-admin-published-sites.handler';
import { GetAdminPublishedSiteHandler } from './application/queries/get-admin-published-site/get-admin-published-site.handler';
import { DisableAdminPublishedSiteHandler } from './application/commands/disable-admin-published-site/disable-admin-published-site.handler';
import { RestoreAdminPublishedSiteHandler } from './application/commands/restore-admin-published-site/restore-admin-published-site.handler';
import { TypeOrmAdminPublishedSiteWriter } from './infrastructure/persistence/typeorm/writers/typeorm-admin-published-site.writer';
import { AdminActivitiesController } from './presentation/http/controllers/admin-activities.controller';
import { TypeOrmAdminActivityReader } from './infrastructure/persistence/typeorm/readers/typeorm-admin-activity.reader';
import { ListAdminActivitiesHandler } from './application/queries/list-admin-activities/list-admin-activities.handler';
import { AdminSessionsController } from './presentation/http/controllers/admin-sessions.controller';
import { TypeOrmAdminSessionReader } from './infrastructure/persistence/typeorm/readers/typeorm-admin-session.reader';
import { GetAdminSessionsOverviewHandler } from './application/queries/get-admin-sessions-overview/get-admin-sessions-overview.handler';
import { ListAdminSessionsHandler } from './application/queries/list-admin-sessions/list-admin-sessions.handler';
import { GetAdminUserIpHistoryHandler } from './application/queries/get-admin-user-ip-history/get-admin-user-ip-history.handler';
import {
  RevokeAdminSessionHandler,
  RevokeAdminUserSessionsHandler,
} from './application/commands/revoke-admin-session/revoke-admin-session.handler';
import { TypeOrmAdminSessionWriter } from './infrastructure/persistence/typeorm/writers/typeorm-admin-session.writer';
import { AdminActionsController } from './presentation/http/controllers/admin-actions.controller';
import { TypeOrmAdminActionReader } from './infrastructure/persistence/typeorm/readers/typeorm-admin-action.reader';
import { TypeOrmAdminActionRecorder } from './infrastructure/persistence/typeorm/writers/typeorm-admin-action.recorder';
import { ListAdminActionsHandler } from './application/queries/list-admin-actions/list-admin-actions.handler';
import { ContentModule } from 'src/modules/content/content.module';
@Module({
  imports: [MarketplaceModule, BillingModule, ContentModule],
  controllers: [
    AdminAccessController,
    AdminUsersController,
    AdminWorkspacesController,
    AdminDashboardController,
    AdminBillingController,
    AdminTemplateCategoryController,
    AdminTemplatePurchaseController,
    AdminMarketplaceCommissionController,
    AdminMarketplaceSalesController,
    AdminTemplatesController,
    AdminPublishedSitesController,
    AdminActivitiesController,
    AdminSessionsController,
    AdminActionsController,
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
      provide: ADMIN_TYPES.ports.MarketplaceSalesReader,
      useClass: TypeOrmAdminMarketplaceSalesReader,
    },
    {
      provide: ADMIN_TYPES.applications.GetAdminMarketplaceSalesOverviewHandler,
      useClass: GetAdminMarketplaceSalesOverviewHandler,
    },
    {
      provide: ADMIN_TYPES.applications.ListAdminMarketplaceSalesHandler,
      useClass: ListAdminMarketplaceSalesHandler,
    },
    {
      provide: ADMIN_TYPES.ports.TemplateReader,
      useClass: TypeOrmAdminTemplateReader,
    },
    {
      provide: ADMIN_TYPES.applications.GetAdminTemplatesOverviewHandler,
      useClass: GetAdminTemplatesOverviewHandler,
    },
    {
      provide: ADMIN_TYPES.applications.ListAdminTemplatesHandler,
      useClass: ListAdminTemplatesHandler,
    },
    {
      provide: ADMIN_TYPES.ports.PublishedSiteReader,
      useClass: TypeOrmAdminPublishedSiteReader,
    },
    {
      provide: ADMIN_TYPES.applications.GetAdminPublishedSitesOverviewHandler,
      useClass: GetAdminPublishedSitesOverviewHandler,
    },
    {
      provide: ADMIN_TYPES.applications.ListAdminPublishedSitesHandler,
      useClass: ListAdminPublishedSitesHandler,
    },
    {
      provide: ADMIN_TYPES.applications.GetAdminPublishedSiteHandler,
      useClass: GetAdminPublishedSiteHandler,
    },
    {
      provide: ADMIN_TYPES.ports.PublishedSiteWriter,
      useClass: TypeOrmAdminPublishedSiteWriter,
    },
    {
      provide: ADMIN_TYPES.applications.DisableAdminPublishedSiteHandler,
      useClass: DisableAdminPublishedSiteHandler,
    },
    {
      provide: ADMIN_TYPES.applications.RestoreAdminPublishedSiteHandler,
      useClass: RestoreAdminPublishedSiteHandler,
    },
    {
      provide: ADMIN_TYPES.ports.ActivityReader,
      useClass: TypeOrmAdminActivityReader,
    },
    {
      provide: ADMIN_TYPES.applications.ListAdminActivitiesHandler,
      useClass: ListAdminActivitiesHandler,
    },
    {
      provide: ADMIN_TYPES.ports.SessionReader,
      useClass: TypeOrmAdminSessionReader,
    },
    {
      provide: ADMIN_TYPES.applications.GetAdminSessionsOverviewHandler,
      useClass: GetAdminSessionsOverviewHandler,
    },
    {
      provide: ADMIN_TYPES.applications.ListAdminSessionsHandler,
      useClass: ListAdminSessionsHandler,
    },
    {
      provide: ADMIN_TYPES.applications.GetAdminUserIpHistoryHandler,
      useClass: GetAdminUserIpHistoryHandler,
    },
    {
      provide: ADMIN_TYPES.ports.SessionWriter,
      useClass: TypeOrmAdminSessionWriter,
    },
    {
      provide: ADMIN_TYPES.applications.RevokeAdminSessionHandler,
      useClass: RevokeAdminSessionHandler,
    },
    {
      provide: ADMIN_TYPES.applications.RevokeAdminUserSessionsHandler,
      useClass: RevokeAdminUserSessionsHandler,
    },
    {
      provide: ADMIN_TYPES.ports.ActionRecorder,
      useClass: TypeOrmAdminActionRecorder,
    },
    {
      provide: ADMIN_TYPES.ports.ActionReader,
      useClass: TypeOrmAdminActionReader,
    },
    {
      provide: ADMIN_TYPES.applications.ListAdminActionsHandler,
      useClass: ListAdminActionsHandler,
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
      provide: ADMIN_TYPES.applications.ListAdminAccessRolesHandler,
      useClass: ListAdminAccessRolesHandler,
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
      provide: ADMIN_TYPES.applications.GetAdminWorkspaceUsageHandler,
      useClass: GetAdminWorkspaceUsageHandler,
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
