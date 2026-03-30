import { WorkspaceModel } from '../../domain/models/workspaces.model';
import { CreateWorkspaceMultiServiceDto } from '../../dto/create-workspace.dto';

export interface CreateWorkspaceService {
  create({
    userId,
    CreateWorkspaceMultiServiceDto,
  }: {
    userId: string;
    CreateWorkspaceMultiServiceDto: CreateWorkspaceMultiServiceDto;
  }): Promise<WorkspaceModel>;

  createDefault({ userId }: { userId: string }): Promise<WorkspaceModel>;
}
