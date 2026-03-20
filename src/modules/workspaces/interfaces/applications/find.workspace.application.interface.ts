import { WorkspaceResponseDto } from '../../dto/response/workspaces.response.dto';

export interface FindWorkspaceApplication {
  findAllByUserId(userId: string): Promise<WorkspaceResponseDto[]>;
}
