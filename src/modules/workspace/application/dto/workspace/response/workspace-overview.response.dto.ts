export class WorkspaceOverviewMetricDto {
  members: number;
  pages: number;
  databases: number;
  updatedLast7Days: number;
}

export class WorkspaceOverviewResponseDto {
  workspaceId: string;
  metrics: WorkspaceOverviewMetricDto;
}
