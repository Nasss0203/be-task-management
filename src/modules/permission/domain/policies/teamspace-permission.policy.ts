import { TeamspaceRole } from 'src/modules/workspace/domain/enums/teamspace-role.enum';

import { PERMISSIONS, PermissionCode } from '../permissions/permission-code';

const OWNER_PERMISSIONS: readonly PermissionCode[] = [
  PERMISSIONS.TEAMSPACE_READ,
  PERMISSIONS.TEAMSPACE_UPDATE,
  PERMISSIONS.TEAMSPACE_DELETE,

  PERMISSIONS.TEAMSPACE_MEMBER_READ,
  PERMISSIONS.TEAMSPACE_MEMBER_ADD,
  PERMISSIONS.TEAMSPACE_MEMBER_REMOVE,

  PERMISSIONS.PAGE_CREATE,
  PERMISSIONS.PAGE_READ,
  PERMISSIONS.PAGE_UPDATE,
  PERMISSIONS.PAGE_DELETE,

  // Page Block
  PERMISSIONS.PAGE_BLOCK_CREATE,
  PERMISSIONS.PAGE_BLOCK_READ,
  PERMISSIONS.PAGE_BLOCK_UPDATE,
  PERMISSIONS.PAGE_BLOCK_DELETE,

  PERMISSIONS.DATABASE_CREATE,
  PERMISSIONS.DATABASE_READ,
  PERMISSIONS.DATABASE_UPDATE,
  PERMISSIONS.DATABASE_DELETE,

  PERMISSIONS.ATTACHMENT_UPLOAD,
  PERMISSIONS.ATTACHMENT_READ,
  PERMISSIONS.ATTACHMENT_DELETE,
];

const MEMBER_PERMISSIONS: readonly PermissionCode[] = [
  PERMISSIONS.TEAMSPACE_READ,

  PERMISSIONS.TEAMSPACE_MEMBER_READ,

  PERMISSIONS.PAGE_CREATE,
  PERMISSIONS.PAGE_READ,
  PERMISSIONS.PAGE_UPDATE,

  // Page Block
  PERMISSIONS.PAGE_BLOCK_CREATE,
  PERMISSIONS.PAGE_BLOCK_READ,
  PERMISSIONS.PAGE_BLOCK_UPDATE,
  PERMISSIONS.PAGE_BLOCK_DELETE,

  PERMISSIONS.DATABASE_CREATE,
  PERMISSIONS.DATABASE_READ,
  PERMISSIONS.DATABASE_UPDATE,

  PERMISSIONS.ATTACHMENT_UPLOAD,
  PERMISSIONS.ATTACHMENT_READ,
];

const TEAMSPACE_ROLE_PERMISSIONS: Record<
  TeamspaceRole,
  readonly PermissionCode[]
> = {
  [TeamspaceRole.OWNER]: OWNER_PERMISSIONS,
  [TeamspaceRole.MEMBER]: MEMBER_PERMISSIONS,
};

export class TeamspacePermissionPolicy {
  static hasPermission(
    role: TeamspaceRole,
    permission: PermissionCode,
  ): boolean {
    return this.getPermissions(role).includes(permission);
  }

  static hasAllPermissions(
    role: TeamspaceRole,
    permissions: readonly PermissionCode[],
  ): boolean {
    return permissions.every((permission) =>
      this.hasPermission(role, permission),
    );
  }

  static getPermissions(role: TeamspaceRole): readonly PermissionCode[] {
    return TEAMSPACE_ROLE_PERMISSIONS[role] ?? [];
  }
}
