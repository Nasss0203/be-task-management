import { CreateWorkspaceMultiServiceDto } from '../../dto/create-workspace.dto';
import { WorkspaceResponseDto } from '../../dto/response/workspaces.response.dto';

export interface CreateWorkspaceApplication {
  create({
    userId,
    CreateWorkspaceMultiServiceDto,
  }: {
    userId: string;
    CreateWorkspaceMultiServiceDto: CreateWorkspaceMultiServiceDto;
  }): Promise<WorkspaceResponseDto>;

  createDeault({
    userId,
    CreateWorkspaceMultiServiceDto,
  }: {
    userId: string;
    CreateWorkspaceMultiServiceDto: CreateWorkspaceMultiServiceDto;
  }): Promise<WorkspaceResponseDto>;
}
