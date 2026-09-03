import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import { ADMIN_TYPES } from '../../../admin.types';
import { AdminWorkspaceMemberListResponseDto } from '../../dto/response/admin-workspace-member-list.response.dto';
import type { AdminWorkspaceReader } from '../../ports/admin-workspace-reader.port';
import { ListAdminWorkspaceMembersQuery } from './list-admin-workspace-members.query';

@Injectable()
export class ListAdminWorkspaceMembersHandler {
  constructor(
    @Inject(ADMIN_TYPES.ports.WorkspaceReader)
    private readonly adminWorkspaceReader: AdminWorkspaceReader,
  ) {}

  async execute(
    query: ListAdminWorkspaceMembersQuery,
  ): Promise<AdminWorkspaceMemberListResponseDto> {
    const workspace = await this.adminWorkspaceReader.findWorkspaceById(
      query.workspaceId,
    );

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    const result = await this.adminWorkspaceReader.listWorkspaceMembers({
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
