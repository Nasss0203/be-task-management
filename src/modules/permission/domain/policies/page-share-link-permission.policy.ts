import { ResourceAccessLevel } from 'src/modules/content/domain/constants/resource-access-level.constant';

import {
  PERMISSIONS,
  type PermissionCode,
} from '../permissions/permission-code';

export class PageShareLinkPermissionPolicy {
  private static readonly permissionMap: Record<
    ResourceAccessLevel,
    readonly PermissionCode[]
  > = {
    [ResourceAccessLevel.VIEWER]: [
      PERMISSIONS.PAGE_READ,
      PERMISSIONS.PAGE_BLOCK_READ,
    ],

    [ResourceAccessLevel.COMMENTER]: [
      PERMISSIONS.PAGE_READ,
      PERMISSIONS.PAGE_BLOCK_READ,
    ],

    [ResourceAccessLevel.EDITOR]: [
      PERMISSIONS.PAGE_READ,
      PERMISSIONS.PAGE_UPDATE,

      PERMISSIONS.PAGE_BLOCK_READ,
      PERMISSIONS.PAGE_BLOCK_CREATE,
      PERMISSIONS.PAGE_BLOCK_UPDATE,
      PERMISSIONS.PAGE_BLOCK_DELETE,
    ],

    /**
     * Link General Access hiện không cho FULL_ACCESS.
     * Để rỗng nhằm fail-safe nếu dữ liệu cũ/bất thường tồn tại.
     */
    [ResourceAccessLevel.FULL_ACCESS]: [],
  };

  static hasAllPermissions(
    accessLevel: ResourceAccessLevel,
    permissions: readonly PermissionCode[],
  ): boolean {
    const allowedPermissions = this.permissionMap[accessLevel];

    return permissions.every((permission) =>
      allowedPermissions.includes(permission),
    );
  }
}
