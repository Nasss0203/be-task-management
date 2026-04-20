export const WORKSPACE_TYPES = {
  services: {
    CreateWorkspaceService: 'CreateWorkspaceService',
    FindWorkspaceService: 'FindWorkspaceService',
    RbacHelper: 'RbacHelper',
    AccessWorkspaceService: 'AccessWorkspaceService',
  },
  applications: {
    CreateWorkspaceApplication: 'CreateWorkspaceApplication',
    FindWorkspaceApplication: 'FindWorkspaceApplication',
    AccessWorkspaceApplication: 'AccessWorkspaceApplication',
  },
  repositories: {
    /** Token cho interface WorkspaceRepository (tránh trùng với token TypeORM 'WorkspaceRepository') */
    WorkspaceRepository: 'IWorkspaceRepository',
    FindWorkspaceRepository: 'FindWorkspaceRepository',
    AccessWorkspaceRepository: 'AccessWorkspaceRepository',
  },
  uow: {
    UnitOfWork: 'UnitOfWork',
  },
};
