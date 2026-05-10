import { WorkspaceOverviewResponseDto } from '../../../dto/response/dashboard/workspace-overview.response.dto';

export interface AdminWorkspaceOverviewApplication {
  getOverview(workspaceId: string): Promise<WorkspaceOverviewResponseDto>;
}
