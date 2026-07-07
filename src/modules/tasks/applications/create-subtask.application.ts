import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { type UnitOfWork } from 'src/interface/index.interface';
import {
  ActivityAction,
  ActivityEntityType,
} from 'src/modules/activity/domain/entities/activity.entity';
import { type CreateActivityService } from 'src/modules/activity/interfaces/services/create-activity.service.interface';
import { ACTIVITY_TYPES } from 'src/modules/activity/interfaces/types';
import { REALTIME_EVENTS } from 'src/modules/realtime/realtime.events';
import { type CreateTaskAssigneeApplication } from 'src/modules/task_assignee/interfaces/applications/create.task_assignee.application.interface';
import { TASK_ASSIGNEE_TYPES } from 'src/modules/task_assignee/interfaces/types';
import { type CreateTaskCommentService } from 'src/modules/task_commnent/interfaces/services/create.task_commnent.service.interface';
import { TASK_COMMENT_TYPES } from 'src/modules/task_commnent/interfaces/types';
import { WORKSPACE_TYPES } from 'src/modules/workspaces/interfaces/types';
import {
  CreateSubtaskApplication,
  CreateSubtaskInput,
} from '../interfaces/applications/create-subtask.application.interface';
import { TaskResponseDto } from '../dto/response/task-response.dto';
import { type CreateTaskService } from '../interfaces/services/create-task.service.interface';
import { type FindTaskService } from '../interfaces/services/find-task.service.interface';
import { TASK_TYPES } from '../interfaces/types';
import { TaskMapper } from '../mapper/tasks.mapper';

@Injectable()
export class CreateSubtaskApplicationImpl implements CreateSubtaskApplication {
  constructor(
    @Inject(TASK_TYPES.services.FindTaskService)
    private readonly findTaskService: FindTaskService,

    @Inject(TASK_TYPES.services.CreateTaskService)
    private readonly createTaskService: CreateTaskService,

    @Inject(TASK_ASSIGNEE_TYPES.applications.CreateTaskAssigneeApplication)
    private readonly createTaskAssigneeApplication: CreateTaskAssigneeApplication,

    @Inject(TASK_COMMENT_TYPES.services.CreateTaskCommentService)
    private readonly createTaskCommentService: CreateTaskCommentService,

    @Inject(ACTIVITY_TYPES.services.CreateActivityService)
    private readonly createActivityService: CreateActivityService,

    @Inject(WORKSPACE_TYPES.uow.UnitOfWork)
    private readonly unitOfWork: UnitOfWork,

    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(input: CreateSubtaskInput): Promise<TaskResponseDto> {
    const subtask = await this.unitOfWork.runInTransaction(async (manager) => {
      const parentTask = await this.findTaskService.findOneTask(
        input.parentTaskId,
        manager,
      );

      if (!parentTask) {
        throw new NotFoundException('Parent task not found');
      }

      if (parentTask.parentTaskId) {
        throw new BadRequestException('Cannot create subtask under a subtask');
      }

      const {
        assigneeIds = [],
        initialComment,
        parentTaskId: _parentTaskId,
        createdBy,
        ...subtaskDto
      } = input;

      const createdSubtask = await this.createTaskService.create(
        {
          ...subtaskDto,
          workspaceId: parentTask.workspaceId,
          projectId: parentTask.projectId,
          sprintId: parentTask.sprintId,
          parentTaskId: parentTask.id,
          createdBy,
          skipPosition: true,
        },
        manager,
      );

      await this.createActivityService.create(
        {
          workspaceId: createdSubtask.workspaceId,
          projectId: createdSubtask.projectId,
          entityType: ActivityEntityType.TASK,
          entityId: createdSubtask.id,
          actorId: createdBy,
          action: ActivityAction.TASK_CREATED,
          metadata: {
            title: createdSubtask.title,
            statusId: createdSubtask.statusId,
            priorityId: createdSubtask.priorityId,
            sprintId: createdSubtask.sprintId,
            parentTaskId: parentTask.id,
          },
        },
        manager,
      );

      const uniqueAssigneeIds = [...new Set(assigneeIds)].filter(Boolean);
      for (const userId of uniqueAssigneeIds) {
        await this.createTaskAssigneeApplication.assign(
          {
            taskId: createdSubtask.id,
            userId,
            assignedBy: createdBy,
          },
          manager,
        );
      }

      if (initialComment?.trim()) {
        await this.createTaskCommentService.create(
          {
            taskId: createdSubtask.id,
            workspaceId: parentTask.workspaceId,
            projectId: parentTask.projectId,
            content: initialComment.trim(),
            authorId: createdBy,
          },
          manager,
        );
      }

      this.eventEmitter.emit(REALTIME_EVENTS.TASK_CREATED, {
        workspaceId: createdSubtask.workspaceId,
        projectId: createdSubtask.projectId,
        task: createdSubtask,
      });

      return createdSubtask;
    });

    return TaskMapper.toResponse(subtask);
  }
}
