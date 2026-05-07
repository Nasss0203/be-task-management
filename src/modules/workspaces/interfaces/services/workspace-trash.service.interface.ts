import { WorkspaceModel } from '../../domain/models/workspaces.model';

export interface WorkspaceTrashService {
  findDeletedWorkspacesByUserId(userId: string): Promise<WorkspaceModel[]>;
  softDeleteWorkspace(
    userId: string,
    workspaceId: string,
  ): Promise<WorkspaceModel>;
  restoreWorkspace(
    userId: string,
    workspaceId: string,
  ): Promise<WorkspaceModel>;
}
