export class DashboardSummaryModel {
  constructor(
    public readonly totalUsers: number,
    public readonly totalWorkspaces: number,
    public readonly totalProjects: number,
    public readonly totalTasks: number,
    public readonly paidWorkspaces: number,
  ) {}
}
