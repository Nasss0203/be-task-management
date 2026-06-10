import { GetWorkspaceOverviewResponseDto } from '../../dto/response/get-workspace-overview.response.dto';

export interface GetWorkspaceOverviewApplication {
  getOverview(
    workspaceId: string,
    userId: string,
  ): Promise<GetWorkspaceOverviewResponseDto>;
}
