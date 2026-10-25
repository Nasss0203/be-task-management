import { TeamspaceRole } from 'src/modules/teamspace/domain/enums/teamspace-role.enum';

import {
  PERMISSIONS,
  type PermissionCode,
} from '../permissions/permission-code';

const OWNER_PERMISSIONS: readonly PermissionCode[] = [
  // Teamspace
  PERMISSIONS.TEAMSPACE_READ,
  PERMISSIONS.TEAMSPACE_UPDATE,
  PERMISSIONS.TEAMSPACE_DELETE,

  // Teamspace Member
  PERMISSIONS.TEAMSPACE_MEMBER_READ,
  PERMISSIONS.TEAMSPACE_MEMBER_ADD,
  PERMISSIONS.TEAMSPACE_MEMBER_UPDATE,
  PERMISSIONS.TEAMSPACE_MEMBER_REMOVE,

  // Page
  PERMISSIONS.PAGE_CREATE,
  PERMISSIONS.PAGE_READ,
  PERMISSIONS.PAGE_UPDATE,
  PERMISSIONS.PAGE_PUBLISH,
  PERMISSIONS.PAGE_DELETE,

  // Page Share
  PERMISSIONS.PAGE_SHARE_READ,
  PERMISSIONS.PAGE_SHARE_ADD,
  PERMISSIONS.PAGE_SHARE_UPDATE,
  PERMISSIONS.PAGE_SHARE_REMOVE,

  // Page Block
  PERMISSIONS.PAGE_BLOCK_CREATE,
  PERMISSIONS.PAGE_BLOCK_READ,
  PERMISSIONS.PAGE_BLOCK_UPDATE,
  PERMISSIONS.PAGE_BLOCK_DELETE,

  // Database
  PERMISSIONS.DATABASE_CREATE,
  PERMISSIONS.DATABASE_READ,
  PERMISSIONS.DATABASE_UPDATE,
  PERMISSIONS.DATABASE_DELETE,

  // Attachment
  PERMISSIONS.ATTACHMENT_UPLOAD,
  PERMISSIONS.ATTACHMENT_READ,
  PERMISSIONS.ATTACHMENT_DELETE,
];

const MEMBER_PERMISSIONS: readonly PermissionCode[] = [
  // Teamspace
  PERMISSIONS.TEAMSPACE_READ,

  // Teamspace Member
  PERMISSIONS.TEAMSPACE_MEMBER_READ,

  // Page
  PERMISSIONS.PAGE_CREATE,
  PERMISSIONS.PAGE_READ,
  PERMISSIONS.PAGE_UPDATE,
  PERMISSIONS.PAGE_PUBLISH,

  // Page Block
  PERMISSIONS.PAGE_BLOCK_CREATE,
  PERMISSIONS.PAGE_BLOCK_READ,
  PERMISSIONS.PAGE_BLOCK_UPDATE,
  PERMISSIONS.PAGE_BLOCK_DELETE,

  // Database
  PERMISSIONS.DATABASE_CREATE,
  PERMISSIONS.DATABASE_READ,
  PERMISSIONS.DATABASE_UPDATE,

  // Attachment
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
