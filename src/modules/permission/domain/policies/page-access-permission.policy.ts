import { ResourceAccessLevel } from 'src/modules/content/domain/constants/resource-access-level.constant';

import {
  PERMISSIONS,
  type PermissionCode,
} from '../permissions/permission-code';

const VIEWER_PERMISSIONS: readonly PermissionCode[] = [
  PERMISSIONS.PAGE_READ,
  PERMISSIONS.PAGE_BLOCK_READ,
];

const COMMENTER_PERMISSIONS: readonly PermissionCode[] = [
  ...VIEWER_PERMISSIONS,
  // PAGE_COMMENT_* sẽ thêm khi có Comment module
];

const EDITOR_PERMISSIONS: readonly PermissionCode[] = [
  ...COMMENTER_PERMISSIONS,

  PERMISSIONS.PAGE_UPDATE,

  PERMISSIONS.PAGE_BLOCK_CREATE,
  PERMISSIONS.PAGE_BLOCK_UPDATE,
  PERMISSIONS.PAGE_BLOCK_DELETE,

  PERMISSIONS.PAGE_SHARE_READ,
  PERMISSIONS.PAGE_SHARE_ADD,
];

const FULL_ACCESS_PERMISSIONS: readonly PermissionCode[] = [
  ...EDITOR_PERMISSIONS,

  PERMISSIONS.PAGE_DELETE,

  PERMISSIONS.PAGE_SHARE_UPDATE,
  PERMISSIONS.PAGE_SHARE_REMOVE,
];

const PAGE_ACCESS_PERMISSIONS: Record<
  ResourceAccessLevel,
  readonly PermissionCode[]
> = {
  [ResourceAccessLevel.VIEWER]: VIEWER_PERMISSIONS,

  [ResourceAccessLevel.COMMENTER]: COMMENTER_PERMISSIONS,

  [ResourceAccessLevel.EDITOR]: EDITOR_PERMISSIONS,

  [ResourceAccessLevel.FULL_ACCESS]: FULL_ACCESS_PERMISSIONS,
};

export class PageAccessPermissionPolicy {
  static hasPermission(
    accessLevel: ResourceAccessLevel,
    permission: PermissionCode,
  ): boolean {
    return this.getPermissions(accessLevel).includes(permission);
  }

  static hasAllPermissions(
    accessLevel: ResourceAccessLevel,
    permissions: readonly PermissionCode[],
  ): boolean {
    return permissions.every((permission) =>
      this.hasPermission(accessLevel, permission),
    );
  }

  static getPermissions(
    accessLevel: ResourceAccessLevel,
  ): readonly PermissionCode[] {
    return PAGE_ACCESS_PERMISSIONS[accessLevel] ?? [];
  }
}
