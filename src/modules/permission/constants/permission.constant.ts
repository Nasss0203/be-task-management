export const PERMISSIONS = {
  WORKSPACE_READ: 'workspace.read',
  WORKSPACE_UPDATE: 'workspace.update',
  WORKSPACE_DELETE: 'workspace.delete',

  WORKSPACE_MEMBER_READ: 'workspace.member.read',
  WORKSPACE_MEMBER_ADD: 'workspace.member.add',
  WORKSPACE_MEMBER_UPDATE_ROLE: 'workspace.member.update_role',
  WORKSPACE_MEMBER_REMOVE: 'workspace.member.remove',

  PAGE_CREATE: 'page.create',
  PAGE_READ: 'page.read',
  PAGE_UPDATE: 'page.update',
  PAGE_DELETE: 'page.delete',

  PAGE_BLOCK_CREATE: 'page_block.create',
  PAGE_BLOCK_READ: 'page_block.read',
  PAGE_BLOCK_UPDATE: 'page_block.update',
  PAGE_BLOCK_DELETE: 'page_block.delete',

  ATTACHMENT_UPLOAD: 'attachment.upload',
  ATTACHMENT_READ: 'attachment.read',
  ATTACHMENT_DELETE: 'attachment.delete',

  ACTIVITY_READ: 'activity.read',
} as const;

export type PermissionCode = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const PERMISSION_SEED_DATA: {
  code: PermissionCode;
  description: string;
}[] = [
  { code: PERMISSIONS.WORKSPACE_READ, description: 'Read workspace' },
  { code: PERMISSIONS.WORKSPACE_UPDATE, description: 'Update workspace' },
  { code: PERMISSIONS.WORKSPACE_DELETE, description: 'Delete workspace' },
  {
    code: PERMISSIONS.WORKSPACE_MEMBER_READ,
    description: 'Read workspace members',
  },
  {
    code: PERMISSIONS.WORKSPACE_MEMBER_ADD,
    description: 'Add member to workspace',
  },
  {
    code: PERMISSIONS.WORKSPACE_MEMBER_UPDATE_ROLE,
    description: 'Update member role in workspace',
  },
  {
    code: PERMISSIONS.WORKSPACE_MEMBER_REMOVE,
    description: 'Remove member from workspace',
  },

  { code: PERMISSIONS.PAGE_CREATE, description: 'Create page' },
  { code: PERMISSIONS.PAGE_READ, description: 'Read page' },
  { code: PERMISSIONS.PAGE_UPDATE, description: 'Update page' },
  { code: PERMISSIONS.PAGE_DELETE, description: 'Delete page' },

  { code: PERMISSIONS.PAGE_BLOCK_CREATE, description: 'Create page block' },
  { code: PERMISSIONS.PAGE_BLOCK_READ, description: 'Read page block' },
  { code: PERMISSIONS.PAGE_BLOCK_UPDATE, description: 'Update page block' },
  { code: PERMISSIONS.PAGE_BLOCK_DELETE, description: 'Delete page block' },

  { code: PERMISSIONS.ATTACHMENT_UPLOAD, description: 'Upload attachment' },
  { code: PERMISSIONS.ATTACHMENT_READ, description: 'Read attachment' },
  { code: PERMISSIONS.ATTACHMENT_DELETE, description: 'Delete attachment' },

  { code: PERMISSIONS.ACTIVITY_READ, description: 'Read activity logs' },
];
