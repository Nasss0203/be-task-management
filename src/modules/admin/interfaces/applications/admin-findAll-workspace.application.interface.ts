import { WorkspaceResponseDto } from 'src/modules/workspaces/dto/response/workspaces.response.dto';
import { AdminFindAllWorkspaceFilter } from 'src/modules/workspaces/interfaces/workspace-filter.type';

export interface AdminFindAllWorkspaceApplication {
  findAllWorkspace(
    filter: AdminFindAllWorkspaceFilter,
  ): Promise<WorkspaceResponseDto[]>;
}
