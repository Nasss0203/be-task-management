import { EntityManager } from 'typeorm';
import { WorkspaceModel } from '../../domain/models/workspaces.model';
import { AdminFindAllWorkspaceFilter } from '../workspace-filter.type';


export interface AdminFindAllWorkspaceRepository {
  findAllWorkspace(
    filter: AdminFindAllWorkspaceFilter,
    manager?: EntityManager,
  ): Promise<WorkspaceModel[]>;
}
