export const ADMIN_TYPES = {
  ports: {
    DashboardReader: Symbol('AdminDashboardReader'),
    UserReader: Symbol('AdminUserReader'),
    UserWriter: Symbol('AdminUserWriter'),
    WorkspaceReader: Symbol('AdminWorkspaceReader'),
    WorkspaceWriter: Symbol('AdminWorkspaceWriter'),
    BillingReader: Symbol('AdminBillingReader'),
    BillingWebhookReader: Symbol('AdminBillingWebhookReader'),
    BillingPlanReader: Symbol('AdminBillingPlanReader'),
    BillingPlanWriter: Symbol('AdminBillingPlanWriter'),
    MarketplaceSalesReader: Symbol('AdminMarketplaceSalesReader'),
    TemplateReader: Symbol('AdminTemplateReader'),
    PublishedSiteReader: Symbol('AdminPublishedSiteReader'),
    ActivityReader: Symbol('AdminActivityReader'),
  },
  applications: {
    GetAdminAccessHandler: Symbol('AdminGetAdminAccessHandler'),
    ListAdminAccessRolesHandler: Symbol('AdminListAdminAccessRolesHandler'),
    GetAdminDashboardOverviewHandler: Symbol(
      'AdminGetAdminDashboardOverviewHandler',
    ),
    ListAdminUsersHandler: Symbol('AdminListAdminUsersHandler'),
    GetAdminUserHandler: Symbol('AdminGetAdminUserHandler'),
    UpdateAdminUserStatusHandler: Symbol('AdminUpdateAdminUserStatusHandler'),
    UpdateAdminUserRoleHandler: Symbol('AdminUpdateAdminUserRoleHandler'),
    ListAdminWorkspacesHandler: Symbol('AdminListAdminWorkspacesHandler'),
    GetAdminWorkspaceHandler: Symbol('AdminGetAdminWorkspaceHandler'),
    GetAdminWorkspaceUsageHandler: Symbol('AdminGetAdminWorkspaceUsageHandler'),
    ListAdminWorkspaceMembersHandler: Symbol(
      'AdminListAdminWorkspaceMembersHandler',
    ),
    ListAdminWorkspaceTeamspacesHandler: Symbol(
      'AdminListAdminWorkspaceTeamspacesHandler',
    ),
    ListAdminWorkspacePagesHandler: Symbol(
      'AdminListAdminWorkspacePagesHandler',
    ),
    GetAdminBillingOverviewHandler: Symbol(
      'AdminGetAdminBillingOverviewHandler',
    ),
    ListAdminBillingSubscriptionsHandler: Symbol(
      'AdminListAdminBillingSubscriptionsHandler',
    ),
    ListAdminBillingPaymentOrdersHandler: Symbol(
      'AdminListAdminBillingPaymentOrdersHandler',
    ),
    ListAdminBillingWebhookEventsHandler: Symbol(
      'AdminListAdminBillingWebhookEventsHandler',
    ),
    ListAdminBillingPlansHandler: Symbol('AdminListAdminBillingPlansHandler'),
    GetAdminBillingPlanHandler: Symbol('AdminGetAdminBillingPlanHandler'),
    UpdateAdminBillingPlanHandler: Symbol('AdminUpdateAdminBillingPlanHandler'),
    CreateAdminBillingPlanPriceVersionHandler: Symbol(
      'AdminCreateAdminBillingPlanPriceVersionHandler',
    ),
    GetAdminMarketplaceSalesOverviewHandler: Symbol(
      'AdminGetAdminMarketplaceSalesOverviewHandler',
    ),
    GetAdminTemplatesOverviewHandler: Symbol(
      'AdminGetAdminTemplatesOverviewHandler',
    ),
    ListAdminTemplatesHandler: Symbol('AdminListAdminTemplatesHandler'),
    GetAdminPublishedSitesOverviewHandler: Symbol(
      'AdminGetAdminPublishedSitesOverviewHandler',
    ),
    ListAdminPublishedSitesHandler: Symbol(
      'AdminListAdminPublishedSitesHandler',
    ),
    GetAdminPublishedSiteHandler: Symbol('AdminGetAdminPublishedSiteHandler'),
    ListAdminActivitiesHandler: Symbol('AdminListAdminActivitiesHandler'),
    ListAdminMarketplaceSalesHandler: Symbol(
      'AdminListAdminMarketplaceSalesHandler',
    ),
  },
  services: {
    AdminAuthorizationService: Symbol('AdminAuthorizationService'),
  },
} as const;
