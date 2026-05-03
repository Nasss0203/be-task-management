import { Inject, Injectable } from '@nestjs/common';
import { AdminWorkspaceItemResponseDto } from 'src/modules/admin/dto/response/workspace-overview.response.dto';
import { type AdminFindAllWorkspaceService } from 'src/modules/workspaces/interfaces/services/admin-findAll-workspace.service.interface';
import { WORKSPACE_TYPES } from 'src/modules/workspaces/interfaces/types';
import { AdminFindAllWorkspaceFilter } from 'src/modules/workspaces/interfaces/workspace-filter.type';
import { AdminFindAllWorkspaceApplication } from '../interfaces/applications/admin-findAll-workspace.application.interface';

@Injectable()
export class AdminFindAllWorkspaceApplicationImpl implements AdminFindAllWorkspaceApplication {
  constructor(
    @Inject(WORKSPACE_TYPES.services.AdminFindAllWorkspaceService)
    private readonly adminFindAllWorkspaceService: AdminFindAllWorkspaceService,
  ) {}

  findAllWorkspace(
    filter: AdminFindAllWorkspaceFilter,
  ): Promise<AdminWorkspaceItemResponseDto[]> {
    return this.adminFindAllWorkspaceService.findAllWorkspace(filter);
  }
}
