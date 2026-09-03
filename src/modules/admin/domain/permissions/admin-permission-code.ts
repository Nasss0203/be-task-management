export const ADMIN_PERMISSIONS = {
  ACCESS_READ: 'admin.access.read',
  USERS_READ: 'admin.users.read',
  USERS_STATUS_UPDATE: 'admin.users.status.update',
  USERS_ROLE_UPDATE: 'admin.users.role.update',
  WORKSPACES_READ: 'admin.workspaces.read',
  DASHBOARD_READ: 'admin.dashboard.read',
} as const;

export type AdminPermissionCode =
  (typeof ADMIN_PERMISSIONS)[keyof typeof ADMIN_PERMISSIONS];
