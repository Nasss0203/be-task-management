import { DashboardWorkspaceResponseDto } from '../../dto/response/my-dashboard.response.dto';

export interface DashboardWorkspacesService {
  getRecentWorkspaces(
    userId: string,
    limit: number,
  ): Promise<DashboardWorkspaceResponseDto[]>;
}
