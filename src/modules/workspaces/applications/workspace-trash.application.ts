import { Inject, Injectable } from '@nestjs/common';
import { WorkspaceResponseDto } from '../dto/response/workspaces.response.dto';
import { WorkspaceTrashApplication } from '../interfaces/applications/workspace-trash.application.interface';
import { type WorkspaceTrashService } from '../interfaces/services/workspace-trash.service.interface';
import { WORKSPACE_TYPES } from '../interfaces/types';
import { WorkspaceMapper } from '../mapper/workspace.mapper';

@Injectable()
export class WorkspaceTrashApplicationImpl implements WorkspaceTrashApplication {
  constructor(
    @Inject(WORKSPACE_TYPES.services.WorkspaceTrashService)
    private readonly service: WorkspaceTrashService,
  ) {}

  async findDeletedWorkspacesByUserId(
    userId: string,
  ): Promise<WorkspaceResponseDto[]> {
    const workspaces = await this.service.findDeletedWorkspacesByUserId(userId);

    return workspaces.map((workspace) => WorkspaceMapper.toResponse(workspace));
  }

  async softDeleteWorkspace(
    userId: string,
    workspaceId: string,
  ): Promise<WorkspaceResponseDto> {
    const workspace = await this.service.softDeleteWorkspace(
      userId,
      workspaceId,
    );

    return WorkspaceMapper.toResponse(workspace);
  }

  async restoreWorkspace(
    userId: string,
    workspaceId: string,
  ): Promise<WorkspaceResponseDto> {
    const workspace = await this.service.restoreWorkspace(userId, workspaceId);

    return WorkspaceMapper.toResponse(workspace);
  }
}
