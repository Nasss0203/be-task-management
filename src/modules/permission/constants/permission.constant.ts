export const PERMISSIONS = {
  WORKSPACE_READ: 'workspace.read',
  WORKSPACE_UPDATE: 'workspace.update',
  WORKSPACE_DELETE: 'workspace.delete',
  WORKSPACE_BILLING_READ: 'workspace.billing.read',
  WORKSPACE_BILLING_MANAGE: 'workspace.billing.manage',
  WORKSPACE_USAGE_READ: 'workspace.usage.read',
  WORKSPACE_FEATURE_READ: 'workspace.feature.read',
  WORKSPACE_FEATURE_UPDATE: 'workspace.feature.update',

  WORKSPACE_MEMBER_READ: 'workspace.member.read',
  WORKSPACE_MEMBER_ADD: 'workspace.member.add',
  WORKSPACE_MEMBER_UPDATE_ROLE: 'workspace.member.update_role',
  WORKSPACE_MEMBER_REMOVE: 'workspace.member.remove',
  WORKSPACE_ROLE_MANAGE: 'workspace.role.manage',

  PROJECT_CREATE: 'project.create',
  PROJECT_READ: 'project.read',
  PROJECT_UPDATE: 'project.update',
  PROJECT_DELETE: 'project.delete',

  BOARD_CREATE: 'board.create',
  BOARD_READ: 'board.read',
  BOARD_UPDATE: 'board.update',
  BOARD_DELETE: 'board.delete',

  TASK_CREATE: 'task.create',
  TASK_READ: 'task.read',
  TASK_UPDATE: 'task.update',
  TASK_DELETE: 'task.delete',
  TASK_ASSIGNEE_ADD: 'task.assignee.add',
  TASK_ASSIGNEE_REMOVE: 'task.assignee.remove',

  TASK_COMMENT_CREATE: 'task.comment.create',
  TASK_COMMENT_READ: 'task.comment.read',
  TASK_COMMENT_UPDATE: 'task.comment.update',
  TASK_COMMENT_DELETE: 'task.comment.delete',

  SPRINT_CREATE: 'sprint.create',
  SPRINT_READ: 'sprint.read',
  SPRINT_UPDATE: 'sprint.update',
  SPRINT_DELETE: 'sprint.delete',
  SPRINT_START: 'sprint.start',
  SPRINT_COMPLETE: 'sprint.complete',
  SPRINT_CANCEL: 'sprint.cancel',

  PAGE_CREATE: 'page.create',
  PAGE_READ: 'page.read',
  PAGE_UPDATE: 'page.update',
  PAGE_DELETE: 'page.delete',

  PAGE_BLOCK_CREATE: 'page_block.create',
  PAGE_BLOCK_READ: 'page_block.read',
  PAGE_BLOCK_UPDATE: 'page_block.update',
  PAGE_BLOCK_DELETE: 'page_block.delete',

  TASK_STATUS_READ: 'task_status.read',
  TASK_STATUS_MANAGE: 'task_status.manage',

  TASK_PRIORITY_READ: 'task_priority.read',
  TASK_PRIORITY_MANAGE: 'task_priority.manage',

  ATTACHMENT_UPLOAD: 'attachment.upload',
  ATTACHMENT_READ: 'attachment.read',
  ATTACHMENT_DELETE: 'attachment.delete',

  ACTIVITY_READ: 'activity.read',
  AUDIT_LOG_READ: 'audit_log.read',
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
    code: PERMISSIONS.WORKSPACE_BILLING_READ,
    description: 'Read workspace billing',
  },
  {
    code: PERMISSIONS.WORKSPACE_BILLING_MANAGE,
    description: 'Manage workspace billing',
  },
  {
    code: PERMISSIONS.WORKSPACE_USAGE_READ,
    description: 'Read workspace usage limits',
  },
  {
    code: PERMISSIONS.WORKSPACE_FEATURE_READ,
    description: 'Read workspace features',
  },
  {
    code: PERMISSIONS.WORKSPACE_FEATURE_UPDATE,
    description: 'Update workspace features',
  },

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
  {
    code: PERMISSIONS.WORKSPACE_ROLE_MANAGE,
    description: 'Manage workspace roles',
  },

  { code: PERMISSIONS.PROJECT_CREATE, description: 'Create project' },
  { code: PERMISSIONS.PROJECT_READ, description: 'Read project' },
  { code: PERMISSIONS.PROJECT_UPDATE, description: 'Update project' },
  { code: PERMISSIONS.PROJECT_DELETE, description: 'Delete project' },

  { code: PERMISSIONS.BOARD_CREATE, description: 'Create board' },
  { code: PERMISSIONS.BOARD_READ, description: 'Read board' },
  { code: PERMISSIONS.BOARD_UPDATE, description: 'Update board' },
  { code: PERMISSIONS.BOARD_DELETE, description: 'Delete board' },

  { code: PERMISSIONS.TASK_CREATE, description: 'Create task' },
  { code: PERMISSIONS.TASK_READ, description: 'Read task' },
  { code: PERMISSIONS.TASK_UPDATE, description: 'Update task' },
  { code: PERMISSIONS.TASK_DELETE, description: 'Delete task' },
  {
    code: PERMISSIONS.TASK_ASSIGNEE_ADD,
    description: 'Assign task members',
  },
  {
    code: PERMISSIONS.TASK_ASSIGNEE_REMOVE,
    description: 'Unassign task members',
  },

  {
    code: PERMISSIONS.TASK_COMMENT_CREATE,
    description: 'Create task comment',
  },
  {
    code: PERMISSIONS.TASK_COMMENT_READ,
    description: 'Read task comments',
  },
  {
    code: PERMISSIONS.TASK_COMMENT_UPDATE,
    description: 'Update task comment',
  },
  {
    code: PERMISSIONS.TASK_COMMENT_DELETE,
    description: 'Delete task comment',
  },

  { code: PERMISSIONS.SPRINT_CREATE, description: 'Create sprint' },
  { code: PERMISSIONS.SPRINT_READ, description: 'Read sprint' },
  { code: PERMISSIONS.SPRINT_UPDATE, description: 'Update sprint' },
  { code: PERMISSIONS.SPRINT_DELETE, description: 'Delete sprint' },
  { code: PERMISSIONS.SPRINT_START, description: 'Start sprint' },
  { code: PERMISSIONS.SPRINT_COMPLETE, description: 'Complete sprint' },
  { code: PERMISSIONS.SPRINT_CANCEL, description: 'Cancel sprint' },

  { code: PERMISSIONS.PAGE_CREATE, description: 'Create page' },
  { code: PERMISSIONS.PAGE_READ, description: 'Read page' },
  { code: PERMISSIONS.PAGE_UPDATE, description: 'Update page' },
  { code: PERMISSIONS.PAGE_DELETE, description: 'Delete page' },

  { code: PERMISSIONS.PAGE_BLOCK_CREATE, description: 'Create page block' },
  { code: PERMISSIONS.PAGE_BLOCK_READ, description: 'Read page block' },
  { code: PERMISSIONS.PAGE_BLOCK_UPDATE, description: 'Update page block' },
  { code: PERMISSIONS.PAGE_BLOCK_DELETE, description: 'Delete page block' },

  { code: PERMISSIONS.TASK_STATUS_READ, description: 'Read task status' },
  {
    code: PERMISSIONS.TASK_STATUS_MANAGE,
    description: 'Manage task statuses',
  },

  { code: PERMISSIONS.TASK_PRIORITY_READ, description: 'Read task priority' },
  {
    code: PERMISSIONS.TASK_PRIORITY_MANAGE,
    description: 'Manage task priorities',
  },

  { code: PERMISSIONS.ATTACHMENT_UPLOAD, description: 'Upload attachment' },
  { code: PERMISSIONS.ATTACHMENT_READ, description: 'Read attachment' },
  { code: PERMISSIONS.ATTACHMENT_DELETE, description: 'Delete attachment' },

  { code: PERMISSIONS.ACTIVITY_READ, description: 'Read activity logs' },
  { code: PERMISSIONS.AUDIT_LOG_READ, description: 'Read audit logs' },
];
