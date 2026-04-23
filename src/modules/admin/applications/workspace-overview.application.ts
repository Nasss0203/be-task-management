import { Inject, Injectable } from '@nestjs/common';
import { type FindProjectService } from 'src/modules/projects/interfaces/services/find.project.service.interface';
import { PROJECT_TYPES } from 'src/modules/projects/interfaces/types';
import { type FindTaskService } from 'src/modules/tasks/interfaces/services/find-task.service.interface';
import { TASK_TYPES } from 'src/modules/tasks/interfaces/types';
import { type FindAllMemberService } from 'src/modules/user_workspace/interfaces/services/find-user-workspace.service.interface';
import { USER_WORKSPACE_TYPES } from 'src/modules/user_workspace/interfaces/types';
import { type FindWorkspaceService } from 'src/modules/workspaces/interfaces/services/find.workspace.service.interface';
import { WORKSPACE_TYPES } from 'src/modules/workspaces/interfaces/types';
import { WorkspaceOverviewResponseDto } from '../dto/response/workspace-overview.response.dto';
import { AdminWorkspaceOverviewApplication } from '../interfaces/applications/workspace-overview.application.interface';

@Injectable()
export class AdminWorkspaceOverviewApplicationImpl implements AdminWorkspaceOverviewApplication {
  constructor(
    @Inject(WORKSPACE_TYPES.services.FindWorkspaceService)
    private readonly findWorkspaceService: FindWorkspaceService,

    @Inject(USER_WORKSPACE_TYPES.services.FindAllMemberService)
    private readonly findUserWorkspaceService: FindAllMemberService,

    @Inject(PROJECT_TYPES.services.FindProjectService)
    private readonly findProjectService: FindProjectService,

    @Inject(TASK_TYPES.services.FindTaskService)
    private readonly findTaskService: FindTaskService,
  ) {}

  async getOverview(
    userId: string,
    workspaceId: string,
  ): Promise<WorkspaceOverviewResponseDto> {
    const workspace = await this.findWorkspaceService.findOneByWorkspaceId(
      userId,
      workspaceId,
    );

    const [members, projects, tasks] = await Promise.all([
      this.findUserWorkspaceService.findAllMember(workspaceId),
      this.findProjectService.findAllByWorkspaceId(workspaceId),
      this.findTaskService.findAllTaskByWorkspace(workspaceId),
    ]);

    return {
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
      planType: workspace.planType,
      createdAt: workspace.createdAt,
      updatedAt: workspace.updatedAt,
      memberCount: members.length,
      projectCount: projects.length,
      taskCount: tasks.length,
    };
  }
}
