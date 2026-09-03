import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ADMIN_TYPES } from '../../../admin.types';
import { AdminWorkspaceDetailResponseDto } from '../../dto/response/admin-workspace-detail.response.dto';
import type { AdminWorkspaceReader } from '../../ports/admin-workspace-reader.port';
import { GetAdminWorkspaceQuery } from './get-admin-workspace.query';

@Injectable()
export class GetAdminWorkspaceHandler {
  constructor(
    @Inject(ADMIN_TYPES.ports.WorkspaceReader)
    private readonly adminWorkspaceReader: AdminWorkspaceReader,
  ) {}

  async execute(
    query: GetAdminWorkspaceQuery,
  ): Promise<AdminWorkspaceDetailResponseDto> {
    const workspace = await this.adminWorkspaceReader.findWorkspaceById(
      query.workspaceId,
    );

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    return workspace;
  }
}
