export const PERMISSION_TYPES = {
  ports: {
    WorkspacePermissionReader: Symbol('WorkspacePermissionReader'),
    TeamspacePermissionReader: Symbol('TeamspacePermissionReader'),
    ResourceAuthorizationReader: Symbol('ResourceAuthorizationReader'),
    PageSharePermissionReader: Symbol('PageSharePermissionReader'),
    PageGeneralAccessReader: Symbol('PageGeneralAccessReader'),
  },
} as const;
