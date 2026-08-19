export const WORKSPACE_TYPES = {
  services: {
    CreateWorkspaceService: 'CreateWorkspaceService',
    FindWorkspaceService: 'FindWorkspaceService',
    AccessWorkspaceService: 'AccessWorkspaceService',
    WorkspaceTrashService: 'WorkspaceTrashService',
    FindWorkspaceOverviewService: 'FindWorkspaceOverviewService',
    UpdateWorkspaceService: 'UpdateWorkspaceService',
    UpdateWorkspaceLayoutModeService: 'UpdateWorkspaceLayoutModeService',
  },
  applications: {
    CreateWorkspaceApplication: 'CreateWorkspaceApplication',
    FindWorkspaceApplication: 'FindWorkspaceApplication',
    AccessWorkspaceApplication: 'AccessWorkspaceApplication',
    WorkspaceTrashApplication: 'WorkspaceTrashApplication',
    FindWorkspaceOverviewApplication: 'FindWorkspaceOverviewApplication',
    UpdateWorkspaceApplication: 'UpdateWorkspaceApplication',
    UpdateWorkspaceLayoutModeApplication:
      'UpdateWorkspaceLayoutModeApplication',
  },
  repositories: {
    WorkspaceRepository: 'IWorkspaceRepository',
    FindWorkspaceRepository: 'FindWorkspaceRepository',
    AccessWorkspaceRepository: 'AccessWorkspaceRepository',
    WorkspaceTrashRepository: 'WorkspaceTrashRepository',
    FindWorkspaceOverviewRepository: 'FindWorkspaceOverviewRepository',
  },
  uow: {
    UnitOfWork: 'UnitOfWork',
  },
};
