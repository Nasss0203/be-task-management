import { Inject, Injectable } from '@nestjs/common';
import { WorkspaceResponseDto } from '../dto/response/workspaces.response.dto';
import { AdminFindAllWorkspaceApplication } from '../interfaces/applications/admin-findAll-workspace.application.interface';
import { WORKSPACE_TYPES } from '../interfaces/types';
import { AdminFindAllWorkspaceFilter } from '../interfaces/workspace-filter.type';
import { WorkspaceMapper } from '../mapper/workspace.mapper';
import { AdminFindAllWorkspaceServiceImpl } from '../services/admin-findAll-workspace.service.interface';

@Injectable()
export class AdminFindAllWorkspaceApplicationImpl implements AdminFindAllWorkspaceApplication {
  constructor(
    @Inject(WORKSPACE_TYPES.services.AdminFindAllWorkspaceService)
    private readonly adminFindAllWorkspaceService: AdminFindAllWorkspaceServiceImpl,
  ) {}

  async findAllWorkspace(
    filter: AdminFindAllWorkspaceFilter,
  ): Promise<WorkspaceResponseDto[]> {
    const workspaces =
      await this.adminFindAllWorkspaceService.findAllWorkspace(filter);

    return workspaces.map(
      (workspace): WorkspaceResponseDto =>
        WorkspaceMapper.toResponse(workspace),
    );
  }
}
