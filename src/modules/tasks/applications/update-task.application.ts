import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { type UnitOfWork } from 'src/interface/index.interface';
import {
  ActivityAction,
  ActivityEntityType,
} from 'src/modules/activity/domain/entities/activity.entity';
import { type CreateActivityService } from 'src/modules/activity/interfaces/services/create-activity.service.interface';
import { ACTIVITY_TYPES } from 'src/modules/activity/interfaces/types';
import { PERMISSIONS } from 'src/modules/permission/constants/permission.constant';
import { type FindPermissionService } from 'src/modules/permission/interfaces/services/find-all-permission.service.interface';
import { PERMISSION_TYPES } from 'src/modules/permission/interfaces/types';
import { WORKSPACE_TYPES } from 'src/modules/workspaces/interfaces/types';
import { TaskModel } from '../domain/models/task.model';
import { TaskResponseDto } from '../dto/response/task-response.dto';
import { UpdateTaskDto } from '../dto/update-task.dto';
import {
  UpdateManyTasksApplicationInput,
  UpdateTaskApplication,
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

    @Inject(PERMISSION_TYPES.services.FindPermissionService)
    private readonly findPermissionService: FindPermissionService,

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
        throw new NotFoundException('Task not found');
      }

      await this.assertCanUpdateStatusOrPriority({
        actorId: updateTaskDto.actorId,
        task: oldTask,
        statusId: updateTaskDto.statusId,
        priorityId: updateTaskDto.priorityId,
        manager,
      });

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

  async updateManyTasks(
    input: UpdateManyTasksApplicationInput,
  ): Promise<TaskResponseDto[]> {
    const { workspaceId, projectId, actorId, dto } = input;

    if (!workspaceId) {
      throw new BadRequestException('workspaceId is required');
    }

    if (!projectId) {
      throw new BadRequestException('projectId is required');
    }

    if (!dto.taskIds?.length) {
      throw new BadRequestException('Task list cannot be empty');
    }

    if (this.hasStatusOrPriorityUpdate(dto)) {
      const taskIds = [...new Set(dto.taskIds)];
      const tasks = await this.findTaskService.findByIds(taskIds);

      if (tasks.length !== taskIds.length) {
        throw new NotFoundException('Some tasks were not found');
      }

      const invalidTask = tasks.find(
        (task) =>
          task.workspaceId !== workspaceId || task.projectId !== projectId,
      );

      if (invalidTask) {
        throw new NotFoundException(
          'Some tasks were not found or do not belong to this workspace/project',
        );
      }

      const tasksWithStatusOrPriorityChange = tasks.filter((task) =>
        this.hasStatusOrPriorityChange(task, dto),
      );

      await this.assertCanUpdateStatusOrPriority({
        actorId,
        workspaceId,
        tasks: tasksWithStatusOrPriorityChange,
      });
    }

    const tasks = await this.updateTaskService.updateManyTasks({
      workspaceId,
      projectId,
      dto,
    });

    return tasks.map(TaskMapper.toResponse);
  }

  private async assertCanUpdateStatusOrPriority(input: {
    actorId: string;
    task?: TaskModel;
    tasks?: TaskModel[];
    workspaceId?: string;
    statusId?: string | null;
    priorityId?: string | null;
    manager?: Parameters<
      FindPermissionService['findPermissionsByUserAndWorkspace']
    >[2];
  }): Promise<void> {
    const tasks = input.tasks ?? (input.task ? [input.task] : []);
    if (!tasks.length) return;

    if (
      input.task &&
      !this.hasStatusOrPriorityChange(input.task, {
        statusId: input.statusId,
        priorityId: input.priorityId,
      })
    ) {
      return;
    }

    const workspaceId = input.workspaceId ?? tasks[0].workspaceId;
    const canManageWorkspaceTasks = await this.canManageWorkspaceTasks(
      input.actorId,
      workspaceId,
      input.manager,
    );

    if (canManageWorkspaceTasks) return;

    const hasUnassignedTask = tasks.some(
      (task) =>
        !task.assignees.some((assignee) => assignee.userId === input.actorId),
    );

    if (hasUnassignedTask) {
      throw new ForbiddenException(
        'Only task assignees can update task status or priority',
      );
    }
  }

  private hasStatusOrPriorityUpdate(dto: {
    statusId?: string | null;
    priorityId?: string | null;
  }): boolean {
    return dto.statusId !== undefined || dto.priorityId !== undefined;
  }

  private hasStatusOrPriorityChange(
    task: TaskModel,
    dto: {
      statusId?: string | null;
      priorityId?: string | null;
    },
  ): boolean {
    return (
      (dto.statusId !== undefined && dto.statusId !== task.statusId) ||
      (dto.priorityId !== undefined && dto.priorityId !== task.priorityId)
    );
  }

  private async canManageWorkspaceTasks(
    actorId: string,
    workspaceId: string,
    manager?: Parameters<
      FindPermissionService['findPermissionsByUserAndWorkspace']
    >[2],
  ): Promise<boolean> {
    const permissions =
      await this.findPermissionService.findPermissionsByUserAndWorkspace(
        actorId,
        workspaceId,
        manager,
      );

    return (
      permissions.includes(PERMISSIONS.WORKSPACE_UPDATE) ||
      permissions.includes(PERMISSIONS.WORKSPACE_MEMBER_UPDATE_ROLE)
    );
  }
}
