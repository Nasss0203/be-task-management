import { AdminWorkspaceItemResponseDto } from 'src/modules/admin/dto/response/workspace-overview.response.dto';
import { EntityManager } from 'typeorm';
import { AdminFindAllWorkspaceFilter } from '../workspace-filter.type';

export interface AdminFindAllWorkspaceService {
  findAllWorkspace(
    filter: AdminFindAllWorkspaceFilter,
    manager?: EntityManager,
  ): Promise<AdminWorkspaceItemResponseDto[]>;
}
