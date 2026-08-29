import { TeamspaceRole } from '../enums/teamspace-role.enum';

export const TEAMSPACE_PERMISSIONS = {
  READ: 'teamspace.read',

  UPDATE: 'teamspace.update',
  DELETE: 'teamspace.delete',

  MEMBER_READ: 'teamspace.member.read',
  MEMBER_ADD: 'teamspace.member.add',
  MEMBER_REMOVE: 'teamspace.member.remove',

  PAGE_CREATE: 'page.create',
  PAGE_READ: 'page.read',
  PAGE_UPDATE: 'page.update',
  PAGE_DELETE: 'page.delete',

  DATABASE_CREATE: 'database.create',
  DATABASE_READ: 'database.read',
  DATABASE_UPDATE: 'database.update',
  DATABASE_DELETE: 'database.delete',

  ATTACHMENT_UPLOAD: 'attachment.upload',
  ATTACHMENT_READ: 'attachment.read',
  ATTACHMENT_DELETE: 'attachment.delete',
} as const;

export type TeamspacePermission =
  (typeof TEAMSPACE_PERMISSIONS)[keyof typeof TEAMSPACE_PERMISSIONS];

const OWNER_PERMISSIONS: readonly TeamspacePermission[] = [
  TEAMSPACE_PERMISSIONS.READ,

  TEAMSPACE_PERMISSIONS.UPDATE,
  TEAMSPACE_PERMISSIONS.DELETE,

  TEAMSPACE_PERMISSIONS.MEMBER_READ,
  TEAMSPACE_PERMISSIONS.MEMBER_ADD,
  TEAMSPACE_PERMISSIONS.MEMBER_REMOVE,

  TEAMSPACE_PERMISSIONS.PAGE_CREATE,
  TEAMSPACE_PERMISSIONS.PAGE_READ,
  TEAMSPACE_PERMISSIONS.PAGE_UPDATE,
  TEAMSPACE_PERMISSIONS.PAGE_DELETE,

  TEAMSPACE_PERMISSIONS.DATABASE_CREATE,
  TEAMSPACE_PERMISSIONS.DATABASE_READ,
  TEAMSPACE_PERMISSIONS.DATABASE_UPDATE,
  TEAMSPACE_PERMISSIONS.DATABASE_DELETE,

  TEAMSPACE_PERMISSIONS.ATTACHMENT_UPLOAD,
  TEAMSPACE_PERMISSIONS.ATTACHMENT_READ,
  TEAMSPACE_PERMISSIONS.ATTACHMENT_DELETE,
];

const MEMBER_PERMISSIONS: readonly TeamspacePermission[] = [
  TEAMSPACE_PERMISSIONS.READ,

  TEAMSPACE_PERMISSIONS.MEMBER_READ,

  TEAMSPACE_PERMISSIONS.PAGE_CREATE,
  TEAMSPACE_PERMISSIONS.PAGE_READ,
  TEAMSPACE_PERMISSIONS.PAGE_UPDATE,

  TEAMSPACE_PERMISSIONS.DATABASE_CREATE,
  TEAMSPACE_PERMISSIONS.DATABASE_READ,
  TEAMSPACE_PERMISSIONS.DATABASE_UPDATE,

  TEAMSPACE_PERMISSIONS.ATTACHMENT_UPLOAD,
  TEAMSPACE_PERMISSIONS.ATTACHMENT_READ,
];

const TEAMSPACE_ROLE_PERMISSIONS: Record<
  TeamspaceRole,
  readonly TeamspacePermission[]
> = {
  [TeamspaceRole.OWNER]: OWNER_PERMISSIONS,
  [TeamspaceRole.MEMBER]: MEMBER_PERMISSIONS,
};

export class TeamspacePermissionPolicy {
  static hasPermission(
    role: TeamspaceRole,
    permission: TeamspacePermission,
  ): boolean {
    return TEAMSPACE_ROLE_PERMISSIONS[role].includes(permission);
  }

  static hasAllPermissions(
    role: TeamspaceRole,
    permissions: readonly TeamspacePermission[],
  ): boolean {
    return permissions.every((permission) =>
      this.hasPermission(role, permission),
    );
  }

  static getPermissions(role: TeamspaceRole): readonly TeamspacePermission[] {
    return TEAMSPACE_ROLE_PERMISSIONS[role];
  }
}
