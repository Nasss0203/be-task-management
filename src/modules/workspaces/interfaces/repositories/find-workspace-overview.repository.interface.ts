import { EntityManager } from 'typeorm';
import { WorkspaceOverviewResponseDto } from '../../dto/response/workspace-overview.response.dto';

export interface FindWorkspaceOverviewRepository {
  findOverview(
    workspaceId: string,
    manager?: EntityManager,
  ): Promise<WorkspaceOverviewResponseDto>;
}
