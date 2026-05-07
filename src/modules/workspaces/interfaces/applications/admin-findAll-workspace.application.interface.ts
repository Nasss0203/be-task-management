import { WorkspaceResponseDto } from '../../dto/response/workspaces.response.dto';
import { AdminFindAllWorkspaceFilter } from '../workspace-filter.type';

export interface AdminFindAllWorkspaceApplication {
  findAllWorkspace(
    filter: AdminFindAllWorkspaceFilter,
  ): Promise<WorkspaceResponseDto[]>;
}
