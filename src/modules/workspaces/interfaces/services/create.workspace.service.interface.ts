import { WorkspaceModel } from '../../domain/models/workspaces.model';
import { CreateWorkspaceDto } from '../../dto/create-workspace.dto';

export interface CreateWorkspaceService {
  create({
    userId,
    createWorkspaceDto,
  }: {
    userId: string;
    createWorkspaceDto: CreateWorkspaceDto;
  }): Promise<WorkspaceModel>;
}
