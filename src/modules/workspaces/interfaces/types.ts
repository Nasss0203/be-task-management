export const WORKSPACE_TYPES = {
  services: {
    CreateWorkspaceService: 'CreateWorkspaceService',
    FindWorkspaceService: 'FindWorkspaceService',
    RbacHelper: 'RbacHelper',
  },
  applications: {
    CreateWorkspaceApplication: 'CreateWorkspaceApplication',
    FindWorkspaceApplication: 'FindWorkspaceApplication',
  },
  repositories: {
    /** Token cho interface WorkspaceRepository (tránh trùng với token TypeORM 'WorkspaceRepository') */
    WorkspaceRepository: 'IWorkspaceRepository',
    FindWorkspaceRepository: 'FindWorkspaceRepository',
  },
  uow: {
    UnitOfWork: 'UnitOfWork',
  },
};
