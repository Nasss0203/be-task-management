import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import { ADMIN_TYPES } from '../../../admin.types';
import { AdminWorkspaceTeamspaceListResponseDto } from '../../dto/response/admin-workspace-teamspace-list.response.dto';
import type { AdminWorkspaceReader } from '../../ports/admin-workspace-reader.port';
import { ListAdminWorkspaceTeamspacesQuery } from './list-admin-workspace-teamspaces.query';

@Injectable()
export class ListAdminWorkspaceTeamspacesHandler {
  constructor(
    @Inject(ADMIN_TYPES.ports.WorkspaceReader)
    private readonly adminWorkspaceReader: AdminWorkspaceReader,
  ) {}

  async execute(
    query: ListAdminWorkspaceTeamspacesQuery,
  ): Promise<AdminWorkspaceTeamspaceListResponseDto> {
    const workspace = await this.adminWorkspaceReader.findWorkspaceById(
      query.workspaceId,
    );

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    const result = await this.adminWorkspaceReader.listWorkspaceTeamspaces({
      workspaceId: query.workspaceId,
      page: query.page,
      limit: query.limit,
      search: query.search,
    });

    return {
      items: result.items,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: Math.ceil(result.total / result.limit),
    };
  }
}
