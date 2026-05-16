import { Inject, Injectable } from '@nestjs/common';
import { WorkspaceOverviewResponseDto } from '../../dto/response/dashboard/workspace-overview.response.dto';
import { AdminWorkspaceOverviewApplication } from '../../interfaces/applications/dashboard/workspace-overview.application.interface';
import { type AdminWorkspaceOverviewService } from '../../interfaces/services/dashboard/admin-workspace-overview.service.interface';
import { ADMIN_TYPES } from '../../interfaces/types';

@Injectable()
export class AdminWorkspaceOverviewApplicationImpl implements AdminWorkspaceOverviewApplication {
  constructor(
    @Inject(ADMIN_TYPES.services.AdminWorkspaceOverviewService)
    private readonly adminWorkspaceOverviewService: AdminWorkspaceOverviewService,
  ) {}

  async getOverview(
    workspaceId: string,
  ): Promise<WorkspaceOverviewResponseDto> {
    const overview =
      await this.adminWorkspaceOverviewService.getOverview(workspaceId);

    return {
      id: overview.id,
      name: overview.name,
      slug: overview.slug,
      planType: overview.planType,
      createdAt: overview.createdAt,
      updatedAt: overview.updatedAt,
      memberCount: overview.memberCount,
      projectCount: overview.projectCount,
      boardCount: overview.boardCount,
      taskCount: overview.taskCount,
    };
  }
}
