import { Inject, Injectable } from '@nestjs/common';
import { type UnitOfWork } from 'src/interface/index.interface';
import {
  ActivityAction,
  ActivityEntityType,
} from 'src/modules/activity/domain/entities/activity.entity';
import { type CreateActivityService } from 'src/modules/activity/interfaces/services/create-activity.service.interface';
import { ACTIVITY_TYPES } from 'src/modules/activity/interfaces/types';
import { DeleteMemberWorkspaceApplication } from '../interfaces/applications/delete-member-workspace.application.interface';
import { type DeleteMemberWorkspaceService } from '../interfaces/services/delete-member-workspace.service.interface';
import { type DeleteTaskAssigneeService } from 'src/modules/task_assignee/interfaces/services/delete.task_assignee.service.interface';
import { TASK_ASSIGNEE_TYPES } from 'src/modules/task_assignee/interfaces/types';
import { USER_WORKSPACE_TYPES } from '../interfaces/types';

@Injectable()
export class DeleteMemberWorkspaceApplicationImpl implements DeleteMemberWorkspaceApplication {
  constructor(
    @Inject(USER_WORKSPACE_TYPES.services.DeleteMemberWorkspaceService)
    private readonly deleteMemberWorkspaceService: DeleteMemberWorkspaceService,

    @Inject(USER_WORKSPACE_TYPES.uow.UnitOfWork)
    private readonly uow: UnitOfWork,

    @Inject(ACTIVITY_TYPES.services.CreateActivityService)
    private readonly createActivityService: CreateActivityService,

    @Inject(TASK_ASSIGNEE_TYPES.services.DeleteTaskAssigneeService)
    private readonly deleteTaskAssigneeService: DeleteTaskAssigneeService,
  ) {}

  async deleteMember(
    workspaceId: string,
    userId: string,
    actorId: string,
  ): Promise<void> {
    return this.uow.runInTransaction(async (manager) => {
      await this.deleteMemberWorkspaceService.deleteMember(
        {
          workspace_id: workspaceId,
          user_id: userId,
          actor_id: actorId,
        },
        manager,
      );

      await this.createActivityService.create(
        {
          workspaceId,
          entityType: ActivityEntityType.WORKSPACE,
          entityId: workspaceId,
          actorId: actorId,
          action: ActivityAction.WORKSPACE_MEMBER_REMOVED,
          metadata: {
            userId: userId,
          },
        },
        manager,
      );

      await this.deleteTaskAssigneeService.unassignFromWorkspace(
        userId,
        workspaceId,
        manager,
      );
    });
  }
}
