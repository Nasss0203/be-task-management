import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { WorkspaceOverviewResponseDto } from '../dto/response/workspace-overview.response.dto';
import { FindWorkspaceOverviewApplication } from '../interfaces/applications/find-workspace-overview.application.interface';
import { type FindWorkspaceOverviewService } from '../interfaces/services/find-workspace-overview.service.interface';
import { type FindWorkspaceService } from '../interfaces/services/find.workspace.service.interface';
import { WORKSPACE_TYPES } from '../interfaces/types';

@Injectable()
export class FindWorkspaceOverviewApplicationImpl implements FindWorkspaceOverviewApplication {
  constructor(
    @Inject(WORKSPACE_TYPES.services.FindWorkspaceOverviewService)
    private readonly findWorkspaceOverviewService: FindWorkspaceOverviewService,

    @Inject(WORKSPACE_TYPES.services.FindWorkspaceService)
    private readonly findWorkspaceService: FindWorkspaceService,
  ) {}

  async findOverview(
    userId: string,
    workspaceId: string,
  ): Promise<WorkspaceOverviewResponseDto> {
    const workspace = await this.findWorkspaceService.findOneByWorkspaceId(
      userId,
      workspaceId,
    );

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    return this.findWorkspaceOverviewService.findOverview(workspaceId);
  }
}
