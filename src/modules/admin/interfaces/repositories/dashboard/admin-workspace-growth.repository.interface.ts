import { EntityManager } from 'typeorm';
import { WorkspaceGrowthQueryDto } from '../../../dto/query/dashboard/workspace-growth-query.dto';
import { WorkspaceGrowthResponseDto } from '../../../dto/response/dashboard/workspace-growth.response.dto';

export interface AdminWorkspaceGrowthRepository {
  getWorkspaceGrowth(
    query: WorkspaceGrowthQueryDto,
    manager?: EntityManager,
  ): Promise<WorkspaceGrowthResponseDto[]>;
}
