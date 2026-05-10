import { Inject, Injectable } from '@nestjs/common';
import { type UnitOfWork } from 'src/interface/index.interface';
import {
  ActivityAction,
  ActivityEntityType,
} from 'src/modules/activity/domain/entities/activity.entity';
import { type CreateActivityService } from 'src/modules/activity/interfaces/services/create-activity.service.interface';
import { ACTIVITY_TYPES } from 'src/modules/activity/interfaces/types';
import { WORKSPACE_TYPES } from 'src/modules/workspaces/interfaces/types';
import { TaskResponseDto } from '../dto/response/task-response.dto';
import { UpdateTaskDto } from '../dto/update-task.dto';
import { UpdateTaskApplication } from '../interfaces/applications/update-task.application.interface';
import { type FindTaskService } from '../interfaces/services/find-task.service.interface';
import { type UpdateTaskService } from '../interfaces/services/update-task.service.interface';
import { TASK_TYPES } from '../interfaces/types';
import { TaskMapper } from '../mapper/tasks.mapper';

@Injectable()
export class UpdateTaskApplicationImpl implements UpdateTaskApplication {
  constructor(
    @Inject(TASK_TYPES.services.UpdateTaskService)
    private readonly updateTaskService: UpdateTaskService,

    @Inject(TASK_TYPES.services.FindTaskService)
    private readonly findTaskService: FindTaskService,

    @Inject(ACTIVITY_TYPES.services.CreateActivityService)
    private readonly createActivityService: CreateActivityService,

    @Inject(WORKSPACE_TYPES.uow.UnitOfWork)
    private readonly uow: UnitOfWork,
  ) {}

  async updateTask(updateTaskDto: UpdateTaskDto): Promise<TaskResponseDto> {
    return this.uow.runInTransaction(async (manager) => {
      const oldTask = await this.findTaskService.findOneTask(
        updateTaskDto.id,
        manager,
      );

      if (!oldTask) {
        throw new Error('Task not found');
      }

      const updatedTask = await this.updateTaskService.updateTask(
        updateTaskDto,
        manager,
      );

      const logChange = async (
        field: string,
        oldValue: unknown,
        newValue: unknown,
      ) => {
        if (oldValue === newValue) return;

        await this.createActivityService.create(
          {
            workspaceId: updatedTask.workspaceId,
            projectId: updatedTask.projectId,
            entityType: ActivityEntityType.TASK,
            entityId: updatedTask.id,
            actorId: updateTaskDto.actorId,
            action: ActivityAction.TASK_UPDATED,
            field,
            oldValue,
            newValue,
          },
          manager,
        );
      };

      if (updateTaskDto.title !== undefined) {
        await logChange('title', oldTask.title, updatedTask.title);
      }

      if (updateTaskDto.description !== undefined) {
        await logChange(
          'description',
          oldTask.description,
          updatedTask.description,
        );
      }

      if (updateTaskDto.statusId !== undefined) {
        await logChange('statusId', oldTask.statusId, updatedTask.statusId);
      }

      if (updateTaskDto.priorityId !== undefined) {
        await logChange(
          'priorityId',
          oldTask.priorityId,
          updatedTask.priorityId,
        );
      }

      if (updateTaskDto.sprintId !== undefined) {
        await logChange('sprintId', oldTask.sprintId, updatedTask.sprintId);
      }

      if (updateTaskDto.startAt !== undefined) {
        await logChange('startAt', oldTask.startAt, updatedTask.startAt);
      }

      if (updateTaskDto.dueAt !== undefined) {
        await logChange('dueAt', oldTask.dueAt, updatedTask.dueAt);
      }

      if (updateTaskDto.estimateMinutes !== undefined) {
        await logChange(
          'estimateMinutes',
          oldTask.estimateMinutes,
          updatedTask.estimateMinutes,
        );
      }

      return TaskMapper.toResponse(updatedTask);
    });
  }
}
