export const PERMISSIONS = {
  WORKSPACE_READ: 'workspace.read',
  WORKSPACE_UPDATE: 'workspace.update',
  WORKSPACE_DELETE: 'workspace.delete',
  WORKSPACE_MANAGE_MEMBERS: 'workspace.manage_members',

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

  ROLE_MANAGE: 'role.manage',
} as const;

export type PermissionCode = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];
