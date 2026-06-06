import { PaginatedAdminWorkspaceResponseDto } from 'src/modules/admin/dto/response/dashboard/workspace-overview.response.dto';
import { EntityManager } from 'typeorm';
import { AdminFindAllWorkspaceFilter } from '../workspace-filter.type';

export interface AdminFindAllWorkspaceRepository {
  findAllWorkspace(
    filter: AdminFindAllWorkspaceFilter,
    manager?: EntityManager,
  ): Promise<PaginatedAdminWorkspaceResponseDto>;
}
