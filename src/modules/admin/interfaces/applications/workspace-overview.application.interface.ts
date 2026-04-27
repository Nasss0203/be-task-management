import { WorkspaceOverviewResponseDto } from '../../dto/response/workspace-overview.response.dto';

export interface AdminWorkspaceOverviewApplication {
  getOverview(workspaceId: string): Promise<WorkspaceOverviewResponseDto>;
}
