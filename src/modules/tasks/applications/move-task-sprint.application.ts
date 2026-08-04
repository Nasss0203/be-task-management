import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { REALTIME_EVENTS } from 'src/modules/realtime/realtime.events';
import {
  ActivityAction,
  ActivityEntityType,
} from 'src/modules/activity/domain/entities/activity.entity';
import { type CreateActivityService } from 'src/modules/activity/interfaces/services/create-activity.service.interface';
import { ACTIVITY_TYPES } from 'src/modules/activity/interfaces/types';
import { SprintStatus } from 'src/modules/sprints/domain/entities/sprint.entity';
import { type FindSprintService } from 'src/modules/sprints/interfaces/services/find-sprint.service.interface';
import { SPRINT_TYPES } from 'src/modules/sprints/interfaces/types';
import { type FindMemberService } from 'src/modules/user_workspace/interfaces/services/find-user-workspace.service.interface';
import { USER_WORKSPACE_TYPES } from 'src/modules/user_workspace/interfaces/types';
import { TaskResponseDto } from '../dto/response/task-response.dto';
import {
  MoveTaskSprintApplication,
  MoveTaskSprintApplicationInput,
} from '../interfaces/applications/move-task-sprint.application.interface';
import { type FindTaskService } from '../interfaces/services/find-task.service.interface';
import { type MoveTaskSprintService } from '../interfaces/services/move-task-sprint.service.interface';
import { TASK_TYPES } from '../interfaces/types';
import { TaskMapper } from '../mapper/tasks.mapper';

@Injectable()
export class MoveTaskSprintApplicationImpl implements MoveTaskSprintApplication {
  constructor(
    @Inject(TASK_TYPES.services.FindTaskService)
    private readonly findTaskService: FindTaskService,

    @Inject(SPRINT_TYPES.services.FindSprintService)
    private readonly findSprintService: FindSprintService,

    @Inject(USER_WORKSPACE_TYPES.services.FindMemberService)
    private readonly findMemberService: FindMemberService,

    @Inject(TASK_TYPES.services.MoveTaskSprintService)
    private readonly moveTaskSprintService: MoveTaskSprintService,

    @Inject(ACTIVITY_TYPES.services.CreateActivityService)
    private readonly createActivityService: CreateActivityService,

    private readonly eventEmitter: EventEmitter2,
  ) {}

  async move(input: MoveTaskSprintApplicationInput): Promise<TaskResponseDto> {
    const task = await this.findTaskService.findOneTask(input.taskId);

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const actorMember = await this.findMemberService.findMemberInWorkspace(
      task.workspaceId,
      input.userId,
    );

    if (!actorMember) {
      throw new ForbiddenException('You are not a member of this workspace');
    }

    if (input.sprintId) {
      const sprint = await this.findSprintService.findOneSprint(input.sprintId);

      if (!sprint) {
        throw new NotFoundException('Sprint not found');
      }

      if (sprint.workspaceId !== task.workspaceId) {
        throw new BadRequestException(
          'Sprint and task must be in the same workspace',
        );
      }

      if (sprint.projectId !== task.projectId) {
        throw new BadRequestException(
          'Sprint and task must be in the same project',
        );
      }

      if (
        sprint.status === SprintStatus.COMPLETED ||
        sprint.status === SprintStatus.CANCELLED
      ) {
        throw new BadRequestException(
          'Cannot move task to completed or cancelled sprint',
        );
      }
    }

    const movedTask = await this.moveTaskSprintService.move({
      sprintId: input.sprintId,
      taskId: input.taskId,
    });

    await this.createActivityService.create({
      workspaceId: movedTask.workspaceId,
      projectId: movedTask.projectId,
      entityType: ActivityEntityType.TASK,
      entityId: movedTask.id,
      actorId: input.userId,
      action: input.sprintId
        ? ActivityAction.TASK_MOVED_TO_SPRINT
        : ActivityAction.TASK_MOVED_TO_BACKLOG,
      field: 'sprintId',
      oldValue: task.sprintId,
      newValue: movedTask.sprintId,
    });

    this.eventEmitter.emit(REALTIME_EVENTS.TASK_UPDATED, {
      workspaceId: movedTask.workspaceId,
      projectId: movedTask.projectId,
      task: movedTask,
    });

    return TaskMapper.toResponse(movedTask);
  }
}
