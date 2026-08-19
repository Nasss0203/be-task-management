export class WorkspaceOverviewMetricDto {
  members: number;
}

export class WorkspaceOverviewResponseDto {
  workspaceId: string;
  metrics: WorkspaceOverviewMetricDto;
}
