import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { RoleName } from 'src/modules/role/domain/entities/role.entity';
import {
  ActivityAction,
  ActivityEntityType,
} from 'src/modules/activity/domain/entities/activity.entity';
import { type CreateActivityService } from 'src/modules/activity/interfaces/services/create-activity.service.interface';
import { ACTIVITY_TYPES } from 'src/modules/activity/interfaces/types';
import { type FindTaskService } from 'src/modules/tasks/interfaces/services/find-task.service.interface';
import { TASK_TYPES } from 'src/modules/tasks/interfaces/types';
import { type FindMemberService } from 'src/modules/user_workspace/interfaces/services/find-user-workspace.service.interface';
import { USER_WORKSPACE_TYPES } from 'src/modules/user_workspace/interfaces/types';
import { DeleteTaskAssigneeResponseDto } from '../dto/response/task_assignee.response.dto';
import {
  DeleteTaskAssigneeApplication,
  DeleteTaskAssigneeApplicationInput,
} from '../interfaces/applications/delete.task_assignee.application.interface';
import { type DeleteTaskAssigneeService } from '../interfaces/services/delete.task_assignee.service.interface';
import { type FindTaskAssigneeService } from '../interfaces/services/find.task_assignee.service.interface';
import { TASK_ASSIGNEE_TYPES } from '../interfaces/types';

@Injectable()
export class DeleteTaskAssigneeApplicationImpl implements DeleteTaskAssigneeApplication {
  constructor(
    @Inject(TASK_ASSIGNEE_TYPES.services.DeleteTaskAssigneeService)
    private readonly deleteTaskAssigneeService: DeleteTaskAssigneeService,

    @Inject(TASK_ASSIGNEE_TYPES.services.FindTaskAssigneeService)
    private readonly findTaskAssigneeService: FindTaskAssigneeService,

    @Inject(USER_WORKSPACE_TYPES.services.FindMemberService)
    private readonly findMemberService: FindMemberService,

    @Inject(TASK_TYPES.services.FindTaskService)
    private readonly findTaskService: FindTaskService,

    @Inject(ACTIVITY_TYPES.services.CreateActivityService)
    private readonly createActivityService: CreateActivityService,
  ) {}

  async unassign(
    input: DeleteTaskAssigneeApplicationInput,
  ): Promise<DeleteTaskAssigneeResponseDto> {
    const task = await this.findTaskService.findOneTask(input.taskId);

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    /**
     * deletedBy = user đang login / người thực hiện hành động
     */
    const actorMember = await this.findMemberService.findMemberInWorkspace(
      task.workspaceId,
      input.deletedBy,
    );

    if (!actorMember) {
      throw new ForbiddenException('You are not a member of this workspace');
    }

    /**
     * userId = user bị unassign khỏi task
     */
    const targetMember = await this.findMemberService.findMemberInWorkspace(
      task.workspaceId,
      input.userId,
    );

    if (!targetMember) {
      throw new BadRequestException(
        'Target user is not a member of this workspace',
      );
    }

    /**
     * Check target user có đang được assign vào task này không
     */
    const taskAssignee = await this.findTaskAssigneeService.findOneTaskAssignee(
      input.taskId,
      input.userId,
    );

    if (!taskAssignee) {
      throw new BadRequestException('User is not assigned to this task');
    }

    const isSelfUnassign = input.userId === input.deletedBy;

    if (actorMember.role_name === RoleName.VIEWER) {
      throw new ForbiddenException('Viewers cannot unassign tasks');
    }

    await this.deleteTaskAssigneeService.unassign({
      taskId: input.taskId,
      userId: input.userId,
      deletedBy: input.deletedBy,
    });

    await this.createActivityService.create({
      workspaceId: task.workspaceId,
      projectId: task.projectId,
      entityType: ActivityEntityType.TASK,
      entityId: task.id,
      actorId: input.deletedBy,
      action: ActivityAction.TASK_UNASSIGNED,
      field: 'assignee',
      oldValue: input.userId,
      metadata: {
        assigneeId: input.userId,
      },
    });

    return {
      taskId: input.taskId,
      userId: input.userId,
      unassigned: true,
    };
  }
}
