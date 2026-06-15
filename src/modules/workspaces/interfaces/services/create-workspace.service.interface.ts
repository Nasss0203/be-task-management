import { EntityManager } from 'typeorm';
import { WorkspaceModel } from '../../domain/models/workspaces.model';

export interface CreateWorkspaceService {
  createDefault(input: {
    userId: string;
    manager?: EntityManager;
  }): Promise<WorkspaceModel>;
}
