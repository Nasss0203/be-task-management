export const PERMISSIONS = [
  { code: 'workspace:read', description: 'Read workspace' },
  { code: 'workspace:update', description: 'Update workspace' },
  { code: 'workspace:delete', description: 'Delete workspace' },

  { code: 'member:invite', description: 'Invite member' },
  { code: 'member:remove', description: 'Remove member' },

  { code: 'task:create', description: 'Create task' },
  { code: 'task:update', description: 'Update task' },
  { code: 'task:delete', description: 'Delete task' },
] as const;

export const ROLE_PERMISSION_TEMPLATE = {
  OWNER: [
    'workspace:read',
    'workspace:update',
    'workspace:delete',
    'member:invite',
    'member:remove',
    'task:create',
    'task:update',
    'task:delete',
  ],
  MEMBER: ['workspace:read', 'task:create', 'task:update'],
} as const;
