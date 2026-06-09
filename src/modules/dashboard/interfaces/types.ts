export const DASHBOARD_TYPES = {
  applications: {
    GetMyDashboardApplication: Symbol('GetMyDashboardApplication'),
    GetWorkspaceOverviewApplication: Symbol('GetWorkspaceOverviewApplication'),
  },
  services: {
    DashboardStatsService: Symbol('DashboardStatsService'),
    DashboardTasksService: Symbol('DashboardTasksService'),
    DashboardWorkspacesService: Symbol('DashboardWorkspacesService'),
    DashboardActivityService: Symbol('DashboardActivityService'),
    DashboardSuggestionsService: Symbol('DashboardSuggestionsService'),
    WorkspaceOverviewService: Symbol('WorkspaceOverviewService'),
  },
  repositories: {
    DashboardRepository: Symbol('DashboardRepository'),
    WorkspaceOverviewRepository: Symbol('WorkspaceOverviewRepository'),
  },
} as const;
