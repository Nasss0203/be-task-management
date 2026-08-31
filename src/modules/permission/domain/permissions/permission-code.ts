export const PERMISSIONS = {
  WORKSPACE_READ: 'workspace.read',
  WORKSPACE_UPDATE: 'workspace.update',
  WORKSPACE_DELETE: 'workspace.delete',

  WORKSPACE_MEMBER_READ: 'workspace.member.read',
  WORKSPACE_MEMBER_ADD: 'workspace.member.add',
  WORKSPACE_MEMBER_UPDATE_ROLE: 'workspace.member.update_role',
  WORKSPACE_MEMBER_REMOVE: 'workspace.member.remove',

  TEAMSPACE_READ: 'teamspace.read',
  TEAMSPACE_UPDATE: 'teamspace.update',
  TEAMSPACE_DELETE: 'teamspace.delete',

  TEAMSPACE_MEMBER_READ: 'teamspace.member.read',
  TEAMSPACE_MEMBER_ADD: 'teamspace.member.add',
  TEAMSPACE_MEMBER_REMOVE: 'teamspace.member.remove',

  PAGE_CREATE: 'page.create',
  PAGE_READ: 'page.read',
  PAGE_UPDATE: 'page.update',
  PAGE_DELETE: 'page.delete',

  PAGE_BLOCK_CREATE: 'page_block.create',
  PAGE_BLOCK_READ: 'page_block.read',
  PAGE_BLOCK_UPDATE: 'page_block.update',
  PAGE_BLOCK_DELETE: 'page_block.delete',

  DATABASE_CREATE: 'database.create',
  DATABASE_READ: 'database.read',
  DATABASE_UPDATE: 'database.update',
  DATABASE_DELETE: 'database.delete',

  ATTACHMENT_UPLOAD: 'attachment.upload',
  ATTACHMENT_READ: 'attachment.read',
  ATTACHMENT_DELETE: 'attachment.delete',

  ACTIVITY_READ: 'activity.read',
} as const;

export type PermissionCode = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];
