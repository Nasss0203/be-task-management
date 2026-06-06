import { AdminFindAllWorkspaceFilter } from 'src/modules/workspaces/interfaces/workspace-filter.type';
import { PaginatedAdminWorkspaceResponseDto } from '../../../dto/response/dashboard/workspace-overview.response.dto';

export interface AdminFindAllWorkspaceApplication {
  findAllWorkspace(
    filter: AdminFindAllWorkspaceFilter,
  ): Promise<PaginatedAdminWorkspaceResponseDto>;
}
