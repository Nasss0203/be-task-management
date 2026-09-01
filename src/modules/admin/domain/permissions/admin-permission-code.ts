export const ADMIN_PERMISSIONS = {
  ACCESS_READ: 'admin.access.read',
} as const;

export type AdminPermissionCode =
  (typeof ADMIN_PERMISSIONS)[keyof typeof ADMIN_PERMISSIONS];
