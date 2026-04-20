import { CreateWorkspaceDto } from '../../dto/create-workspace.dto';
import { WorkspaceResponseDto } from '../../dto/response/workspaces.response.dto';

export interface CreateWorkspaceApplication {
  create({
    userId,
    createWorkspaceDto,
  }: {
    userId: string;
    createWorkspaceDto: CreateWorkspaceDto;
  }): Promise<WorkspaceResponseDto>;

  createDeault({
    userId,
    createWorkspaceDto,
  }: {
    userId: string;
    createWorkspaceDto: CreateWorkspaceDto;
  }): Promise<WorkspaceResponseDto>;
}
