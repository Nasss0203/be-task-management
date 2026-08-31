export const PERMISSION_TYPES = {
  ports: {
    WorkspacePermissionReader: Symbol('WorkspacePermissionReader'),
    TeamspacePermissionReader: Symbol('TeamspacePermissionReader'),
    ResourceAuthorizationReader: Symbol('ResourceAuthorizationReader'),
  },
} as const;
