export const ADMIN_TYPES = {
  applications: {
    GetAdminAccessHandler: Symbol('AdminGetAdminAccessHandler'),
  },
  services: {
    AdminAuthorizationService: Symbol('AdminAuthorizationService'),
  },
} as const;
