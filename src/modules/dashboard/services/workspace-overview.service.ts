import { Inject, Injectable } from '@nestjs/common';
import { GetWorkspaceOverviewResponseDto } from '../dto/response/get-workspace-overview.response.dto';
import type { WorkspaceOverviewRepository } from '../interfaces/repositories/workspace-overview.repository.interface';
import type { WorkspaceOverviewService } from '../interfaces/services/workspace-overview.service.interface';
import { DASHBOARD_TYPES } from '../interfaces/types';

@Injectable()
export class WorkspaceOverviewServiceImpl implements WorkspaceOverviewService {
  constructor(
    @Inject(DASHBOARD_TYPES.repositories.WorkspaceOverviewRepository)
    private readonly workspaceOverviewRepository: WorkspaceOverviewRepository,
  ) {}

  async getOverview(
    workspaceId: string,
    userId: string,
  ): Promise<GetWorkspaceOverviewResponseDto> {
    return this.workspaceOverviewRepository.getOverview(workspaceId, userId);
  }
}
