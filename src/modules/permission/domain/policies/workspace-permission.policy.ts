import { WorkspaceRole } from 'src/modules/workspace/domain/enums/workspace-role.enum';
import { PERMISSIONS, PermissionCode } from '../permissions/permission-code';

const OWNER_PERMISSIONS: readonly PermissionCode[] = [
  PERMISSIONS.WORKSPACE_READ,
  PERMISSIONS.WORKSPACE_UPDATE,
  PERMISSIONS.WORKSPACE_DELETE,
  PERMISSIONS.WORKSPACE_MEMBER_READ,
  PERMISSIONS.WORKSPACE_MEMBER_ADD,
  PERMISSIONS.WORKSPACE_MEMBER_UPDATE_ROLE,
  PERMISSIONS.WORKSPACE_MEMBER_REMOVE,
  PERMISSIONS.PAGE_CREATE,
  PERMISSIONS.PAGE_READ,
  PERMISSIONS.PAGE_UPDATE,
  PERMISSIONS.PAGE_DELETE,
  PERMISSIONS.PAGE_BLOCK_CREATE,
  PERMISSIONS.PAGE_BLOCK_READ,
  PERMISSIONS.PAGE_BLOCK_UPDATE,
  PERMISSIONS.PAGE_BLOCK_DELETE,
  PERMISSIONS.ATTACHMENT_UPLOAD,
  PERMISSIONS.ATTACHMENT_READ,
  PERMISSIONS.ATTACHMENT_DELETE,
  PERMISSIONS.ACTIVITY_READ,
];

const MEMBER_PERMISSIONS: readonly PermissionCode[] = [
  PERMISSIONS.WORKSPACE_READ,
  PERMISSIONS.WORKSPACE_MEMBER_READ,
  PERMISSIONS.PAGE_READ,
  PERMISSIONS.PAGE_BLOCK_CREATE,
  PERMISSIONS.PAGE_BLOCK_READ,
  PERMISSIONS.PAGE_BLOCK_UPDATE,
  PERMISSIONS.PAGE_BLOCK_DELETE,
  PERMISSIONS.ATTACHMENT_UPLOAD,
  PERMISSIONS.ATTACHMENT_READ,
  PERMISSIONS.ATTACHMENT_DELETE,
  PERMISSIONS.ACTIVITY_READ,
];

const WORKSPACE_ROLE_PERMISSIONS: Record<
  WorkspaceRole,
  readonly PermissionCode[]
> = {
  [WorkspaceRole.OWNER]: OWNER_PERMISSIONS,
  [WorkspaceRole.MEMBER]: MEMBER_PERMISSIONS,
};

export class WorkspacePermissionPolicy {
  static hasPermission(
    role: WorkspaceRole,
    permission: PermissionCode,
  ): boolean {
    return this.getPermissions(role).includes(permission);
  }

  static hasAllPermissions(
    role: WorkspaceRole,
    permissions: readonly PermissionCode[],
  ): boolean {
    return permissions.every((permission) =>
      this.hasPermission(role, permission),
    );
  }

  static getPermissions(role: WorkspaceRole): readonly PermissionCode[] {
    return WORKSPACE_ROLE_PERMISSIONS[role] ?? [];
  }
}
