import { WorkspaceResponseDto } from '../../dto/response/workspaces.response.dto';

export interface WorkspaceTrashApplication {
  findDeletedWorkspacesByUserId(
    userId: string,
  ): Promise<WorkspaceResponseDto[]>;
  softDeleteWorkspace(
    userId: string,
    workspaceId: string,
  ): Promise<WorkspaceResponseDto>;
  restoreWorkspace(
    userId: string,
    workspaceId: string,
  ): Promise<WorkspaceResponseDto>;
}
