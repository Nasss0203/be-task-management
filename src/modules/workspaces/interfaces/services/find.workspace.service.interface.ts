import { WorkspaceModel } from '../../domain/models/workspaces.model';

export interface FindWorkspaceService {
  findAllByUserId(userId: string): Promise<WorkspaceModel[]>;
}
