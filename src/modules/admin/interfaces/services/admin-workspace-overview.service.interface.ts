import { EntityManager } from 'typeorm';
import { WorkspaceOverviewModel } from '../../domain/models/workspace-overview.model';

export interface AdminWorkspaceOverviewService {
  getOverview(
    workspaceId: string,
    manager?: EntityManager,
  ): Promise<WorkspaceOverviewModel>;
}
