import { EntityManager } from 'typeorm';
import { WorkspaceModel } from '../../domain/models/workspaces.model';
import { AdminFindAllWorkspaceFilter } from '../workspace-filter.type';

export interface AdminFindAllWorkspaceService {
  findAllWorkspace(
    filter: AdminFindAllWorkspaceFilter,
    manager?: EntityManager,
  ): Promise<WorkspaceModel[]>;
}
