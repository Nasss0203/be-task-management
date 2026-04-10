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

export const PERMISSION_SEED_DATA: {
  code: PermissionCode;
  description: string;
}[] = [
  { code: PERMISSIONS.WORKSPACE_READ, description: 'Read workspace' },
  { code: PERMISSIONS.WORKSPACE_UPDATE, description: 'Update workspace' },
  { code: PERMISSIONS.WORKSPACE_DELETE, description: 'Delete workspace' },
  {
    code: PERMISSIONS.WORKSPACE_MANAGE_MEMBERS,
    description: 'Manage workspace members',
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

  { code: PERMISSIONS.ROLE_MANAGE, description: 'Manage roles' },
];
