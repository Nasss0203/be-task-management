import { WorkspaceAccessModel } from '../repositories/access-workspace.repository.interface';

export interface AccessWorkspaceService {
  getWorkspaceAccess(
    userId: string,
    workspaceId: string,
  ): Promise<WorkspaceAccessModel>;
}
