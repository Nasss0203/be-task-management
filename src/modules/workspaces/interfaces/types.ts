export const WORKSPACE_TYPES = {
  services: {
    CreateWorkspaceService: 'CreateWorkspaceService',
    FindWorkspaceService: 'FindWorkspaceService',
    RbacHelper: 'RbacHelper',
    AccessWorkspaceService: 'AccessWorkspaceService',
    AdminFindAllWorkspaceService: 'AdminFindAllWorkspaceService',
    AdminWorkspaceMemberSummaryService: 'AdminWorkspaceMemberSummaryService',
    CreateWorkspaceTemplateService: 'CreateWorkspaceTemplateService',
  },
  applications: {
    CreateWorkspaceApplication: 'CreateWorkspaceApplication',
    FindWorkspaceApplication: 'FindWorkspaceApplication',
    AccessWorkspaceApplication: 'AccessWorkspaceApplication',
    AdminFindAllWorkspaceApplication: 'AdminFindAllWorkspaceApplication',
    AdminWorkspaceMemberSummaryApplication:
      'AdminWorkspaceMemberSummaryApplication',
    CreateWorkspaceTemplateApplication: 'CreateWorkspaceTemplateApplication',
  },
  repositories: {
    WorkspaceRepository: 'IWorkspaceRepository',
    FindWorkspaceRepository: 'FindWorkspaceRepository',
    AccessWorkspaceRepository: 'AccessWorkspaceRepository',
    AdminFindAllWorkspaceRepository: 'AdminFindAllWorkspaceRepository',
    AdminWorkspaceMemberSummaryRepository:
      'AdminWorkspaceMemberSummaryRepository',
  },
  uow: {
    UnitOfWork: 'UnitOfWork',
  },
};
