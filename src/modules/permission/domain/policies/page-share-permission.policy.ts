import {
  PERMISSIONS,
  type PermissionCode,
} from '../permissions/permission-code';

export type PageShareAccessLevel = 'VIEWER' | 'EDITOR';

const VIEWER_PERMISSIONS: readonly PermissionCode[] = [
  PERMISSIONS.PAGE_READ,
  PERMISSIONS.PAGE_BLOCK_READ,
];

const EDITOR_PERMISSIONS: readonly PermissionCode[] = [
  PERMISSIONS.PAGE_READ,
  PERMISSIONS.PAGE_UPDATE,

  PERMISSIONS.PAGE_BLOCK_READ,
  PERMISSIONS.PAGE_BLOCK_CREATE,
  PERMISSIONS.PAGE_BLOCK_UPDATE,
  PERMISSIONS.PAGE_BLOCK_DELETE,
];

const PAGE_SHARE_PERMISSIONS: Record<
  PageShareAccessLevel,
  readonly PermissionCode[]
> = {
  VIEWER: VIEWER_PERMISSIONS,
  EDITOR: EDITOR_PERMISSIONS,
};

export class PageSharePermissionPolicy {
  static hasPermission(
    accessLevel: PageShareAccessLevel,
    permission: PermissionCode,
  ): boolean {
    return this.getPermissions(accessLevel).includes(permission);
  }

  static hasAllPermissions(
    accessLevel: PageShareAccessLevel,
    permissions: readonly PermissionCode[],
  ): boolean {
    return permissions.every((permission) =>
      this.hasPermission(accessLevel, permission),
    );
  }

  static getPermissions(
    accessLevel: PageShareAccessLevel,
  ): readonly PermissionCode[] {
    return PAGE_SHARE_PERMISSIONS[accessLevel] ?? [];
  }
}
