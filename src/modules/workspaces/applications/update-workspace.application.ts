import { Inject, Injectable } from '@nestjs/common';
import {
  type UpdateWorkspaceApplication,
  type UpdateWorkspaceApplicationInput,
} from '../interfaces/applications/update-workspace.application.interface';
import { type UpdateWorkspaceService } from '../interfaces/services/update-workspace.service.interface';
import { WORKSPACE_TYPES } from '../interfaces/types';
import { WorkspaceMapper } from '../mapper/workspace.mapper';

@Injectable()
export class UpdateWorkspaceApplicationImpl
  implements UpdateWorkspaceApplication
{
  constructor(
    @Inject(WORKSPACE_TYPES.services.UpdateWorkspaceService)
    private readonly service: UpdateWorkspaceService,
  ) {}

  async update({ userId, workspaceId, dto }: UpdateWorkspaceApplicationInput) {
    const workspace = await this.service.update({
      userId,
      workspaceId,
      name: dto.name,
    });

    return WorkspaceMapper.toResponse(workspace);
  }
}
