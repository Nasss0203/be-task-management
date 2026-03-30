import { EntityManager } from 'typeorm';
import { WorkspaceModel } from '../../domain/models/workspaces.model';

export interface FindWorkspaceRepository {
  findWorkspacesByUserId(
    userId: string,
    manager?: EntityManager,
  ): Promise<WorkspaceModel[]>;

  findOneWorkspaceById(
    userId: string,
    workspaceId: string,
    manager?: EntityManager,
  ): Promise<WorkspaceModel | null>;
}
