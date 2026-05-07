import { WorkspaceOverviewResponseDto } from '../../dto/response/workspace-overview.response.dto';

export interface AdminWorkspaceOverviewApplication {
  getOverview(
    userId: string,
    workspaceId: string,
  ): Promise<WorkspaceOverviewResponseDto>;
}
