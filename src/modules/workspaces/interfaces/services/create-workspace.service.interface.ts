import { WorkspaceModel } from '../../domain/models/workspaces.model';

export interface CreateWorkspaceService {
  createDefault({ userId }: { userId: string }): Promise<WorkspaceModel>;
}
