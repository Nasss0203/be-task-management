export const ADMIN_TYPES = {
  ports: {
    DashboardReader: Symbol('AdminDashboardReader'),
    UserReader: Symbol('AdminUserReader'),
    UserWriter: Symbol('AdminUserWriter'),
    WorkspaceReader: Symbol('AdminWorkspaceReader'),
    WorkspaceWriter: Symbol('AdminWorkspaceWriter'),
  },
  applications: {
    GetAdminAccessHandler: Symbol('AdminGetAdminAccessHandler'),
    GetAdminDashboardOverviewHandler: Symbol('AdminGetAdminDashboardOverviewHandler'),
    ListAdminUsersHandler: Symbol('AdminListAdminUsersHandler'),
    GetAdminUserHandler: Symbol('AdminGetAdminUserHandler'),
    UpdateAdminUserStatusHandler: Symbol('AdminUpdateAdminUserStatusHandler'),
    UpdateAdminUserRoleHandler: Symbol('AdminUpdateAdminUserRoleHandler'),
    ListAdminWorkspacesHandler: Symbol('AdminListAdminWorkspacesHandler'),
    GetAdminWorkspaceHandler: Symbol('AdminGetAdminWorkspaceHandler'),
    ListAdminWorkspaceMembersHandler: Symbol('AdminListAdminWorkspaceMembersHandler'),
    ListAdminWorkspaceTeamspacesHandler: Symbol('AdminListAdminWorkspaceTeamspacesHandler'),
    ListAdminWorkspacePagesHandler: Symbol('AdminListAdminWorkspacePagesHandler'),
  },
  services: {
    AdminAuthorizationService: Symbol('AdminAuthorizationService'),
  },
} as const;
