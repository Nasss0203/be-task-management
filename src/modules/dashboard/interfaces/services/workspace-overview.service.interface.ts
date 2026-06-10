import { GetWorkspaceOverviewResponseDto } from '../../dto/response/get-workspace-overview.response.dto';

export interface WorkspaceOverviewService {
  getOverview(
    workspaceId: string,
    userId: string,
  ): Promise<GetWorkspaceOverviewResponseDto>;
}
