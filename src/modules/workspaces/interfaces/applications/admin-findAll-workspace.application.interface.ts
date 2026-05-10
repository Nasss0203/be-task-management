import { AdminWorkspaceItemResponseDto } from 'src/modules/admin/dto/response/dashboard/workspace-overview.response.dto';
import { AdminFindAllWorkspaceFilter } from '../workspace-filter.type';

export interface AdminFindAllWorkspaceApplication {
  findAllWorkspace(
    filter: AdminFindAllWorkspaceFilter,
  ): Promise<AdminWorkspaceItemResponseDto[]>;
}
