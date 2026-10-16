export const ADMIN_PERMISSIONS = {
  ACCESS_READ: 'admin.access.read',

  // Users
  USERS_READ: 'admin.users.read',
  USERS_STATUS_UPDATE: 'admin.users.status.update',
  USERS_ROLE_UPDATE: 'admin.users.role.update',

  // Workspaces
  WORKSPACES_READ: 'admin.workspaces.read',

  // Dashboard
  DASHBOARD_READ: 'admin.dashboard.read',

  // Billing
  BILLING_READ: 'admin.billing.read',
  BILLING_UPDATE: 'admin.billing.update',

  // Template Categories
  TEMPLATE_CATEGORIES_CREATE: 'admin.template-categories.create',
  TEMPLATE_CATEGORIES_READ: 'admin.template-categories.read',
  TEMPLATE_CATEGORIES_UPDATE: 'admin.template-categories.update',
} as const;

export type AdminPermissionCode =
  (typeof ADMIN_PERMISSIONS)[keyof typeof ADMIN_PERMISSIONS];
