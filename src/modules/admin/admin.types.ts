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
  },
  applications: {
    GetAdminAccessHandler: Symbol('AdminGetAdminAccessHandler'),
    GetAdminDashboardOverviewHandler: Symbol(
      'AdminGetAdminDashboardOverviewHandler',
    ),
    ListAdminUsersHandler: Symbol('AdminListAdminUsersHandler'),
    GetAdminUserHandler: Symbol('AdminGetAdminUserHandler'),
    UpdateAdminUserStatusHandler: Symbol('AdminUpdateAdminUserStatusHandler'),
    UpdateAdminUserRoleHandler: Symbol('AdminUpdateAdminUserRoleHandler'),
    ListAdminWorkspacesHandler: Symbol('AdminListAdminWorkspacesHandler'),
    GetAdminWorkspaceHandler: Symbol('AdminGetAdminWorkspaceHandler'),
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
  },
  services: {
    AdminAuthorizationService: Symbol('AdminAuthorizationService'),
  },
} as const;
