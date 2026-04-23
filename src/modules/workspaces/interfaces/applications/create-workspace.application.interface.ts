import { CreateWorkspaceDto } from '../../dto/create-workspace.dto';
import { WorkspaceResponseDto } from '../../dto/response/workspaces.response.dto';

export interface CreateWorkspaceApplication {
  createDeault({
    userId,
    createWorkspaceDto,
  }: {
    userId: string;
    createWorkspaceDto: CreateWorkspaceDto;
  }): Promise<WorkspaceResponseDto>;
}
