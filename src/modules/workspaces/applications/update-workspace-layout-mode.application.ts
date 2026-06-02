import { Inject, Injectable } from '@nestjs/common';
import {
  type UpdateWorkspaceLayoutModeApplication,
  type UpdateWorkspaceLayoutModeApplicationInput,
} from '../interfaces/applications/update-workspace-layout-mode.application.interface';
import { type UpdateWorkspaceLayoutModeService } from '../interfaces/services/update-workspace-layout-mode.service.interface';
import { WORKSPACE_TYPES } from '../interfaces/types';
import { WorkspaceMapper } from '../mapper/workspace.mapper';

@Injectable()
export class UpdateWorkspaceLayoutModeApplicationImpl
  implements UpdateWorkspaceLayoutModeApplication
{
  constructor(
    @Inject(WORKSPACE_TYPES.services.UpdateWorkspaceLayoutModeService)
    private readonly service: UpdateWorkspaceLayoutModeService,
  ) {}

  async updateLayoutMode({
    userId,
    workspaceId,
    dto,
  }: UpdateWorkspaceLayoutModeApplicationInput) {
    const workspace = await this.service.updateLayoutMode({
      userId,
      workspaceId,
      layoutMode: dto.layoutMode,
    });

    return WorkspaceMapper.toResponse(workspace);
  }
}
