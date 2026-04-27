import { EntityManager } from 'typeorm';
import { WorkspaceOverviewModel } from '../../domain/models/workspace-overview.model';

export interface AdminWorkspaceOverviewRepository {
  getOverview(
    workspaceId: string,
    manager?: EntityManager,
  ): Promise<WorkspaceOverviewModel>;
}
