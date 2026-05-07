import { EntityManager } from 'typeorm';
import { WorkspaceModel } from '../../domain/models/workspaces.model';

export interface WorkspaceTrashRepository {
  findDeletedWorkspacesByUserId(
    userId: string,
    manager?: EntityManager,
  ): Promise<WorkspaceModel[]>;

  softDeleteWorkspace(
    userId: string,
    workspaceId: string,
    manager?: EntityManager,
  ): Promise<WorkspaceModel | null>;

  restoreWorkspace(
    userId: string,
    workspaceId: string,
    manager?: EntityManager,
  ): Promise<WorkspaceModel | null>;
}
