import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { REALTIME_EVENTS } from 'src/modules/realtime/realtime.events';
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
import {
  UpdateManyTasksApplicationInput,
  UpdateTaskApplication,
  UpdateTaskInput,
} from '../interfaces/applications/update-task.application.interface';
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

    private readonly eventEmitter: EventEmitter2,
  ) { }

  async updateTask(updateTaskDto: UpdateTaskInput): Promise<TaskResponseDto> {
    return this.uow.runInTransaction(async (manager) => {
      const oldTask = await this.findTaskService.findOneTask(
        updateTaskDto.id,
        manager,
      );

      if (!oldTask) {
        throw new NotFoundException('Task not found');
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

      this.eventEmitter.emit(REALTIME_EVENTS.TASK_UPDATED, {
        workspaceId: updatedTask.workspaceId,
        projectId: updatedTask.projectId,
        task: updatedTask,
      });

      return TaskMapper.toResponse(updatedTask);
    });
  }

  async updateManyTasks(
    input: UpdateManyTasksApplicationInput,
  ): Promise<TaskResponseDto[]> {
    const { workspaceId, projectId, dto } = input;

    if (!workspaceId) {
      throw new BadRequestException('workspaceId is required');
    }

    if (!projectId) {
      throw new BadRequestException('projectId is required');
    }

    if (!dto.taskIds?.length) {
      throw new BadRequestException('Task list cannot be empty');
    }

    const taskIds = [...new Set(dto.taskIds)];
    const validationTasks = await this.findTaskService.findByIds(taskIds);

    if (validationTasks.length !== taskIds.length) {
      throw new NotFoundException('Some tasks were not found');
    }

    const invalidTask = validationTasks.find(
      (task) =>
        task.workspaceId !== workspaceId || task.projectId !== projectId,
    );

    if (invalidTask) {
      throw new NotFoundException(
        'Some tasks were not found or do not belong to this workspace/project',
      );
    }

    const tasks = await this.updateTaskService.updateManyTasks({
      workspaceId,
      projectId,
      dto,
    });

    for (const task of tasks) {
      this.eventEmitter.emit(REALTIME_EVENTS.TASK_UPDATED, {
        workspaceId: task.workspaceId,
        projectId: task.projectId,
        task: task,
      });
    }

    return tasks.map(TaskMapper.toResponse);
  }

}
