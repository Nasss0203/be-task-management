import { Inject, Injectable } from '@nestjs/common';
import { WorkspaceAccessResponseDto } from '../dto/response/workspaces.response.dto';
import { AccessWorkspaceApplication } from '../interfaces/applications/access-workspace.application.interface';
import { type AccessWorkspaceService } from '../interfaces/services/access-workspace.service.interface';
import { WORKSPACE_TYPES } from '../interfaces/types';

@Injectable()
export class AccessWorkspaceApplicationImpl implements AccessWorkspaceApplication {
  constructor(
    @Inject(WORKSPACE_TYPES.services.AccessWorkspaceService)
    private readonly accessWorkspaceService: AccessWorkspaceService,
  ) {}

  async getWorkspaceAccess(
    userId: string,
    workspaceId: string,
  ): Promise<WorkspaceAccessResponseDto> {
    const access = await this.accessWorkspaceService.getWorkspaceAccess(
      userId,
      workspaceId,
    );

    return {
      user_id: access.user_id,
      workspace_id: access.workspace_id,
      roles: access.roles,
      permissions: access.permissions,
    };
  }
}
