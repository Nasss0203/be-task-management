import { WorkspaceOverviewResponseDto } from '../../dto/response/workspace-overview.response.dto';

export interface FindWorkspaceOverviewApplication {
  findOverview(
    userId: string,
    workspaceId: string,
  ): Promise<WorkspaceOverviewResponseDto>;
}
