import { Inject, Injectable } from '@nestjs/common';
import { WorkspaceResponseDto } from 'src/modules/workspaces/dto/response/workspaces.response.dto';
import { AdminFindAllWorkspaceFilter } from 'src/modules/workspaces/interfaces/workspace-filter.type';
import { AdminFindAllWorkspaceService } from 'src/modules/workspaces/interfaces/services/admin-fileAll-workspace.service.interface';
import { WORKSPACE_TYPES } from 'src/modules/workspaces/interfaces/types';
import { WorkspaceMapper } from 'src/modules/workspaces/mapper/workspace.mapper';
import { AdminFindAllWorkspaceApplication } from '../interfaces/applications/admin-findAll-workspace.application.interface';
import { AdminFindAllWorkspaceServiceImpl } from 'src/modules/workspaces/services/admin-findAll-workspace.service.interface';

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
