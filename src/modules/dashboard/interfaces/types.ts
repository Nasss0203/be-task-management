export const DASHBOARD_TYPES = {
  applications: {
    GetMyDashboardApplication: Symbol('GetMyDashboardApplication'),
  },
  services: {
    DashboardStatsService: Symbol('DashboardStatsService'),
    DashboardTasksService: Symbol('DashboardTasksService'),
    DashboardWorkspacesService: Symbol('DashboardWorkspacesService'),
    DashboardActivityService: Symbol('DashboardActivityService'),
    DashboardSuggestionsService: Symbol('DashboardSuggestionsService'),
  },
  repositories: {
    DashboardRepository: Symbol('DashboardRepository'),
  },
} as const;
