import { WorkspaceGrowthQueryDto } from '../../../dto/query/dashboard/workspace-growth-query.dto';
import { WorkspaceGrowthResponseDto } from '../../../dto/response/dashboard/workspace-growth.response.dto';

export interface AdminWorkspaceGrowthApplication {
  getWorkspaceGrowth(
    query: WorkspaceGrowthQueryDto,
  ): Promise<WorkspaceGrowthResponseDto[]>;
}
