export const WORKSPACE_TYPES = {
  services: {
    CreateWorkspaceService: 'CreateWorkspaceService',
    CreateWorkspaceTemplateService: 'CreateWorkspaceTemplateService',

    FindWorkspaceService: 'FindWorkspaceService',
    RbacHelper: 'RbacHelper',
    AccessWorkspaceService: 'AccessWorkspaceService',
    AdminFindAllWorkspaceService: 'AdminFindAllWorkspaceService',
    WorkspaceTrashService: 'WorkspaceTrashService',
  },
  applications: {
    CreateWorkspaceApplication: 'CreateWorkspaceApplication',
    CreateWorkspaceTemplateApplication: 'CreateWorkspaceTemplateApplication',

    FindWorkspaceApplication: 'FindWorkspaceApplication',
    AccessWorkspaceApplication: 'AccessWorkspaceApplication',
    AdminFindAllWorkspaceApplication: 'AdminFindAllWorkspaceApplication',
    WorkspaceTrashApplication: 'WorkspaceTrashApplication',
  },
  repositories: {
    /** Token cho interface WorkspaceRepository (tránh trùng với token TypeORM 'WorkspaceRepository') */
    WorkspaceRepository: 'IWorkspaceRepository',
    FindWorkspaceRepository: 'FindWorkspaceRepository',
    AccessWorkspaceRepository: 'AccessWorkspaceRepository',
    AdminFindAllWorkspaceRepository: 'AdminFindAllWorkspaceRepository',
    CreateWorkspaceTemplateRepository: 'CreateWorkspaceTemplateRepository',
    WorkspaceTrashRepository: 'WorkspaceTrashRepository',
  },
  uow: {
    UnitOfWork: 'UnitOfWork',
  },
};
