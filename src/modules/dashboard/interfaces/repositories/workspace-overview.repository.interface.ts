import { GetWorkspaceOverviewResponseDto } from '../../dto/response/get-workspace-overview.response.dto';

export interface WorkspaceOverviewRepository {
  getOverview(
    workspaceId: string,
    userId: string,
  ): Promise<GetWorkspaceOverviewResponseDto>;
}
