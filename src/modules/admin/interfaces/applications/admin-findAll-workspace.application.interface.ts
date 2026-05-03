import { AdminFindAllWorkspaceFilter } from 'src/modules/workspaces/interfaces/workspace-filter.type';
import { AdminWorkspaceItemResponseDto } from '../../dto/response/workspace-overview.response.dto';

export interface AdminFindAllWorkspaceApplication {
  findAllWorkspace(
    filter: AdminFindAllWorkspaceFilter,
  ): Promise<AdminWorkspaceItemResponseDto[]>;
}
