import { Inject, Injectable } from '@nestjs/common';
import { GetWorkspaceOverviewResponseDto } from '../dto/response/get-workspace-overview.response.dto';
import type { GetWorkspaceOverviewApplication } from '../interfaces/applications/get-workspace-overview.application.interface';
import type { WorkspaceOverviewService } from '../interfaces/services/workspace-overview.service.interface';
import { DASHBOARD_TYPES } from '../interfaces/types';

@Injectable()
export class GetWorkspaceOverviewApplicationImpl implements GetWorkspaceOverviewApplication {
  constructor(
    @Inject(DASHBOARD_TYPES.services.WorkspaceOverviewService)
    private readonly workspaceOverviewService: WorkspaceOverviewService,
  ) {}

  async getOverview(
    workspaceId: string,
    userId: string,
  ): Promise<GetWorkspaceOverviewResponseDto> {
    return this.workspaceOverviewService.getOverview(workspaceId, userId);
  }
}
