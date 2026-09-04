import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import { ADMIN_TYPES } from '../../../admin.types';
import { AdminWorkspacePageListResponseDto } from '../../dto/response/admin-workspace-page-list.response.dto';
import type { AdminWorkspaceReader } from '../../ports/admin-workspace-reader.port';
import { ListAdminWorkspacePagesQuery } from './list-admin-workspace-pages.query';

@Injectable()
export class ListAdminWorkspacePagesHandler {
  constructor(
    @Inject(ADMIN_TYPES.ports.WorkspaceReader)
    private readonly adminWorkspaceReader: AdminWorkspaceReader,
  ) {}

  async execute(
    query: ListAdminWorkspacePagesQuery,
  ): Promise<AdminWorkspacePageListResponseDto> {
    const workspace = await this.adminWorkspaceReader.findWorkspaceById(
      query.workspaceId,
    );

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    const result = await this.adminWorkspaceReader.listWorkspacePages({
      workspaceId: query.workspaceId,
      page: query.page,
      limit: query.limit,
      search: query.search,
      teamspaceId: query.teamspaceId,
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
