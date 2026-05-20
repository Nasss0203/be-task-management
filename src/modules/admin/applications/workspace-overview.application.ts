import { Inject, Injectable } from '@nestjs/common';
import { type FindProjectService } from 'src/modules/projects/interfaces/services/find.project.service.interface';
import { PROJECT_TYPES } from 'src/modules/projects/interfaces/types';
import { type FindTaskService } from 'src/modules/tasks/interfaces/services/find-task.service.interface';
import { TASK_TYPES } from 'src/modules/tasks/interfaces/types';
import { type FindMemberService } from 'src/modules/user_workspace/interfaces/services/find-user-workspace.service.interface';
import { USER_WORKSPACE_TYPES } from 'src/modules/user_workspace/interfaces/types';
import { type FindWorkspaceService } from 'src/modules/workspaces/interfaces/services/find.workspace.service.interface';
import { WORKSPACE_TYPES } from 'src/modules/workspaces/interfaces/types';
import { AdminWorkspaceOverviewResponseDto } from '../dto/response/dashboard/workspace-overview.response.dto';
import { AdminWorkspaceOverviewApplication } from '../interfaces/applications/dashboard/workspace-overview.application.interface';
import { type AdminWorkspaceOverviewService } from '../interfaces/services/dashboard/admin-workspace-overview.service.interface';
import { ADMIN_TYPES } from '../interfaces/types';

@Injectable()
export class AdminWorkspaceOverviewApplicationImpl implements AdminWorkspaceOverviewApplication {
  constructor(
    @Inject(WORKSPACE_TYPES.services.FindWorkspaceService)
    private readonly findWorkspaceService: FindWorkspaceService,

    @Inject(USER_WORKSPACE_TYPES.services.FindMemberService)
    private readonly findUserWorkspaceService: FindMemberService,

    @Inject(PROJECT_TYPES.services.FindProjectService)
    private readonly findProjectService: FindProjectService,

    @Inject(TASK_TYPES.services.FindTaskService)
    private readonly findTaskService: FindTaskService,

    @Inject(ADMIN_TYPES.services.AdminWorkspaceOverviewService)
    private readonly adminWorkspaceOverviewService: AdminWorkspaceOverviewService,
  ) {}

  async getOverview(
    workspaceId: string,
  ): Promise<AdminWorkspaceOverviewResponseDto> {
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
