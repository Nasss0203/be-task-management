import { Inject, Injectable } from '@nestjs/common';
import { WorkspaceResponseDto } from '../dto/response/workspaces.response.dto';
import { FindWorkspaceApplication } from '../interfaces/applications/find.workspace.application.interface';
import { type FindWorkspaceService } from '../interfaces/services/find.workspace.service.interface';
import { WORKSPACE_TYPES } from '../interfaces/types';
import { WorkspaceMapper } from '../mapper/workspace.mapper';

@Injectable()
export class FindWorkspaceApplicationImpl implements FindWorkspaceApplication {
  constructor(
    @Inject(WORKSPACE_TYPES.services.FindWorkspaceService)
    private readonly service: FindWorkspaceService,
  ) {}

  async findAllByUserId(userId: string): Promise<WorkspaceResponseDto[]> {
    const workspaces = await this.service.findAllByUserId(userId);

    return workspaces.map((workspace) => WorkspaceMapper.toResponse(workspace));
  }
}
