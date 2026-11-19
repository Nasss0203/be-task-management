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
    PublishedSiteWriter: Symbol('AdminPublishedSiteWriter'),
    ActivityReader: Symbol('AdminActivityReader'),
    SessionReader: Symbol('AdminSessionReader'),
    SessionWriter: Symbol('AdminSessionWriter'),
    ActionRecorder: Symbol('AdminActionRecorder'),
    ActionReader: Symbol('AdminActionReader'),
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
    DisableAdminPublishedSiteHandler: Symbol(
      'AdminDisableAdminPublishedSiteHandler',
    ),
    RestoreAdminPublishedSiteHandler: Symbol(
      'AdminRestoreAdminPublishedSiteHandler',
    ),
    ListAdminActivitiesHandler: Symbol('AdminListAdminActivitiesHandler'),
    GetAdminSessionsOverviewHandler: Symbol(
      'AdminGetAdminSessionsOverviewHandler',
    ),
    ListAdminSessionsHandler: Symbol('AdminListAdminSessionsHandler'),
    GetAdminUserIpHistoryHandler: Symbol('AdminGetAdminUserIpHistoryHandler'),
    RevokeAdminSessionHandler: Symbol('AdminRevokeAdminSessionHandler'),
    RevokeAdminUserSessionsHandler: Symbol(
      'AdminRevokeAdminUserSessionsHandler',
    ),
    ListAdminActionsHandler: Symbol('AdminListAdminActionsHandler'),
    ListAdminMarketplaceSalesHandler: Symbol(
      'AdminListAdminMarketplaceSalesHandler',
    ),
  },
  services: {
    AdminAuthorizationService: Symbol('AdminAuthorizationService'),
  },
} as const;
