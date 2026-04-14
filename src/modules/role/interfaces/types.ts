export const ROLE_TYPES = {
  services: {
    CreateRoleService: 'CreateRoleService',
    FindRoleService: 'FindRoleService',
  },
  applications: {
    CreateRoleApplication: 'CreateRoleApplication',
  },
  repositories: {
    /** Token cho interface WorkspaceRepository (tránh trùng với token TypeORM 'WorkspaceRepository') */
    RoleRepository: 'IRoleRepository',
    FindRoleRepository: 'FindRoleRepository',
  },
};
