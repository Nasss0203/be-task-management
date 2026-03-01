export const WORKSPACETYPES = {
  services: {
    CreateWorkspaceService: 'CreateWorkspaceService',
    RbacHelper: 'RbacHelper',
  },
  applications: {
    CreateWorkspaceApplication: 'CreateWorkspaceApplication',
  },
  repositories: {
    /** Token cho interface WorkspaceRepository (tránh trùng với token TypeORM 'WorkspaceRepository') */
    WorkspaceRepository: 'IWorkspaceRepository',
  },
  uow: {
    UnitOfWork: 'UnitOfWork',
  },
};
