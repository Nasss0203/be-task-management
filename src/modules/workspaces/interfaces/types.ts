export const WORKSPACE_TYPES = {
  services: {
    CreateWorkspaceService: 'CreateWorkspaceService',
    CreateWorkspaceTemplateService: 'CreateWorkspaceTemplateService',
    FindWorkspaceService: 'FindWorkspaceService',
    RbacHelper: 'RbacHelper',
    AccessWorkspaceService: 'AccessWorkspaceService',
    AdminFindAllWorkspaceService: 'AdminFindAllWorkspaceService',
    AdminWorkspaceMemberSummaryService: 'AdminWorkspaceMemberSummaryService',
    WorkspaceTrashService: 'WorkspaceTrashService',
    FindWorkspaceOverviewService: 'FindWorkspaceOverviewService',
    UpdateWorkspaceLayoutModeService: 'UpdateWorkspaceLayoutModeService',
  },
  applications: {
    CreateWorkspaceApplication: 'CreateWorkspaceApplication',
    CreateWorkspaceTemplateApplication: 'CreateWorkspaceTemplateApplication',
    FindWorkspaceApplication: 'FindWorkspaceApplication',
    AccessWorkspaceApplication: 'AccessWorkspaceApplication',
    AdminFindAllWorkspaceApplication: 'AdminFindAllWorkspaceApplication',
    AdminWorkspaceMemberSummaryApplication:
      'AdminWorkspaceMemberSummaryApplication',
    WorkspaceTrashApplication: 'WorkspaceTrashApplication',
    FindWorkspaceOverviewApplication: 'FindWorkspaceOverviewApplication',
    UpdateWorkspaceLayoutModeApplication: 'UpdateWorkspaceLayoutModeApplication',
  },
  repositories: {
    WorkspaceRepository: 'IWorkspaceRepository',
    FindWorkspaceRepository: 'FindWorkspaceRepository',
    AccessWorkspaceRepository: 'AccessWorkspaceRepository',
    AdminFindAllWorkspaceRepository: 'AdminFindAllWorkspaceRepository',
    AdminWorkspaceMemberSummaryRepository:
      'AdminWorkspaceMemberSummaryRepository',
    CreateWorkspaceTemplateRepository: 'CreateWorkspaceTemplateRepository',
    WorkspaceTrashRepository: 'WorkspaceTrashRepository',
    FindWorkspaceOverviewRepository: 'FindWorkspaceOverviewRepository',
  },
  uow: {
    UnitOfWork: 'UnitOfWork',
  },
};
