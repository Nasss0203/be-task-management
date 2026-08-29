import { WorkspaceRole } from 'src/modules/workspace/domain/enums/workspace-role.enum';
import { PERMISSIONS, PermissionCode } from './permission.constant';

export const ROLE_PERMISSION_MAP: Record<WorkspaceRole, PermissionCode[]> = {
  [WorkspaceRole.OWNER]: Object.values(PERMISSIONS),

  [WorkspaceRole.MEMBER]: [
    PERMISSIONS.WORKSPACE_READ,
    PERMISSIONS.WORKSPACE_MEMBER_READ,

    PERMISSIONS.PAGE_READ,
    PERMISSIONS.PAGE_BLOCK_CREATE,
    PERMISSIONS.PAGE_BLOCK_READ,
    PERMISSIONS.PAGE_BLOCK_UPDATE, // Member can edit blocks in accessible pages
    PERMISSIONS.PAGE_BLOCK_DELETE, // Member can delete blocks in accessible pages

    PERMISSIONS.ATTACHMENT_UPLOAD,
    PERMISSIONS.ATTACHMENT_READ,
    PERMISSIONS.ATTACHMENT_DELETE,

    PERMISSIONS.ACTIVITY_READ,
  ],
};
