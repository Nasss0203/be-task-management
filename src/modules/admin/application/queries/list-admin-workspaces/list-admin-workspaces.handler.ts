import { Inject, Injectable } from '@nestjs/common';
import { ADMIN_TYPES } from '../../../admin.types';
import { AdminWorkspaceListResponseDto } from '../../dto/response/admin-workspace-list.response.dto';
import type { AdminWorkspaceReader } from '../../ports/admin-workspace-reader.port';
import { ListAdminWorkspacesQuery } from './list-admin-workspaces.query';

@Injectable()
export class ListAdminWorkspacesHandler {
  constructor(
    @Inject(ADMIN_TYPES.ports.WorkspaceReader)
    private readonly adminWorkspaceReader: AdminWorkspaceReader,
  ) {}

  async execute(
    query: ListAdminWorkspacesQuery,
  ): Promise<AdminWorkspaceListResponseDto> {
    const result = await this.adminWorkspaceReader.listWorkspaces({
      page: query.page,
      limit: query.limit,
      search: query.search,
    });

    return {
      items: result.items,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages:
        result.total === 0 ? 0 : Math.ceil(result.total / result.limit),
    };
  }
}
