import { WorkspaceResponseDto } from '../../dto/response/workspaces.response.dto';

export interface FindWorkspaceApplication {
  findAllByUserId(userId: string): Promise<WorkspaceResponseDto[]>;
  findOneWorkspaceById(
    userId: string,
    workspaceId: string,
  ): Promise<WorkspaceResponseDto | null>;
}
