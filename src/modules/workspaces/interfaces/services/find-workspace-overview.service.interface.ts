import { EntityManager } from 'typeorm';
import { WorkspaceOverviewResponseDto } from '../../dto/response/workspace-overview.response.dto';

export interface FindWorkspaceOverviewService {
  findOverview(
    workspaceId: string,
    manager?: EntityManager,
  ): Promise<WorkspaceOverviewResponseDto>;
}
