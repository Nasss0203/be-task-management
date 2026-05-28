import { Inject, Injectable } from '@nestjs/common';

import { CreateTaskDto } from '../dto/create-task.dto';
import { TaskResponseDto } from '../dto/response/task-response.dto';
import { CreateTaskApplication } from '../interfaces/applications/create-task.application.interface';
import { type CreateTaskService } from '../interfaces/services/create-task.service.interface';
import { TASK_TYPES } from '../interfaces/types';
import { TaskMapper } from '../mapper/tasks.mapper';

import { type UnitOfWork } from 'src/interface/index.interface';
import {
  ActivityAction,
  ActivityEntityType,
} from 'src/modules/activity/domain/entities/activity.entity';
import { type CreateActivityService } from 'src/modules/activity/interfaces/services/create-activity.service.interface';
import { ACTIVITY_TYPES } from 'src/modules/activity/interfaces/types';
import { type CreateTaskAssigneeApplication } from 'src/modules/task_assignee/interfaces/applications/create.task_assignee.application.interface';
import { TASK_ASSIGNEE_TYPES } from 'src/modules/task_assignee/interfaces/types';
import { type CreateTaskCommentService } from 'src/modules/task_commnent/interfaces/services/create.task_commnent.service.interface';
import { TASK_COMMENT_TYPES } from 'src/modules/task_commnent/interfaces/types';
import { WORKSPACE_TYPES } from 'src/modules/workspaces/interfaces/types';

@Injectable()
export class CreateTaskApplicationImpl implements CreateTaskApplication {
  constructor(
    @Inject(TASK_TYPES.services.CreateTaskService)
    private readonly service: CreateTaskService,

    @Inject(TASK_ASSIGNEE_TYPES.applications.CreateTaskAssigneeApplication)
    private readonly createTaskAssigneeApplication: CreateTaskAssigneeApplication,

    @Inject(TASK_COMMENT_TYPES.services.CreateTaskCommentService)
    private readonly createTaskCommentService: CreateTaskCommentService,

    @Inject(ACTIVITY_TYPES.services.CreateActivityService)
    private readonly createActivityService: CreateActivityService,

    @Inject(WORKSPACE_TYPES.uow.UnitOfWork)
    private readonly unitOfWork: UnitOfWork,
  ) {}

  async create(createTaskDto: CreateTaskDto): Promise<TaskResponseDto> {
    const task = await this.unitOfWork.runInTransaction(async (manager) => {
      const {
        assigneeIds = [],
        initialComment,
        ...taskCreateDto
      } = createTaskDto;

      const createdTask = await this.service.create(taskCreateDto, manager);

      await this.createActivityService.create(
        {
          workspaceId: createdTask.workspaceId,
          projectId: createdTask.projectId,
          entityType: ActivityEntityType.TASK,
          entityId: createdTask.id,
          actorId: createTaskDto.createdBy,
          action: ActivityAction.TASK_CREATED,
          metadata: {
            title: createdTask.title,
            statusId: createdTask.statusId,
            priorityId: createdTask.priorityId,
            sprintId: createdTask.sprintId,
          },
        },
        manager,
      );

      const uniqueAssigneeIds = [...new Set(assigneeIds)].filter(Boolean);
      for (const userId of uniqueAssigneeIds) {
        await this.createTaskAssigneeApplication.assign(
          {
            taskId: createdTask.id,
            userId,
            assignedBy: createTaskDto.createdBy,
          },
          manager,
        );
      }

      if (initialComment?.trim()) {
        await this.createTaskCommentService.create(
          {
            taskId: createdTask.id,
            workspaceId: createTaskDto.workspaceId,
            projectId: createTaskDto.projectId,
            content: initialComment.trim(),
            authorId: createTaskDto.createdBy,
          },
          manager,
        );
      }

      console.log('6. done');

      return createdTask;
    });

    return TaskMapper.toResponse(task);
  }
}
