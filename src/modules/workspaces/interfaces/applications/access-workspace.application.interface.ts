import { WorkspaceAccessResponseDto } from '../../dto/response/workspaces.response.dto';

export interface AccessWorkspaceApplication {
  getWorkspaceAccess(
    userId: string,
    workspaceId: string,
  ): Promise<WorkspaceAccessResponseDto>;
}
