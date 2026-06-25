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
import { DeleteTaskApplication } from '../interfaces/applications/delete-task.application.interface';
import { type DeleteTaskService } from '../interfaces/services/delete-task.service.interface';
import { type FindTaskService } from '../interfaces/services/find-task.service.interface';
import { TASK_TYPES } from '../interfaces/types';

@Injectable()
export class DeleteTaskApplicationImpl implements DeleteTaskApplication {
  constructor(
    @Inject(TASK_TYPES.services.FindTaskService)
    private readonly findTaskService: FindTaskService,

    @Inject(TASK_TYPES.services.DeleteTaskService)
    private readonly deleteTaskService: DeleteTaskService,

    @Inject(ACTIVITY_TYPES.services.CreateActivityService)
    private readonly createActivityService: CreateActivityService,

    @Inject(WORKSPACE_TYPES.uow.UnitOfWork)
    private readonly uow: UnitOfWork,
    
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async delete(input: {
    workspaceId: string;
    taskId: string;
    userId: string;
  }): Promise<void> {
    const task = await this.findTaskService.findOneTask(input.taskId);

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    await this.uow.runInTransaction(async (manager) => {
      await this.deleteTaskService.softDeleteTask(
        {
          taskId: input.taskId,
          deletedBy: input.userId,
        },
        manager,
      );

      await this.createActivityService.create(
        {
          workspaceId: task.workspaceId,
          projectId: task.projectId,
          entityType: ActivityEntityType.TASK,
          entityId: task.id,
          actorId: input.userId,
          action: ActivityAction.TASK_DELETED,
          metadata: {
            title: task.title,
          },
        },
        manager,
      );

      this.eventEmitter.emit(REALTIME_EVENTS.TASK_DELETED, {
        workspaceId: task.workspaceId,
        projectId: task.projectId,
        taskId: input.taskId,
      });
    });
  }

  async restore(input: {
    workspaceId: string;
    taskId: string;
    userId: string;
  }): Promise<void> {
    const task = await this.findTaskService.findOneTaskForRestore(
      input.workspaceId,
      input.taskId,
    );

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    if (!task.deletedAt) {
      throw new BadRequestException('Task is not deleted');
    }

    if (task.workspaceDeletedAt) {
      throw new BadRequestException(
        'Cannot restore task because workspace is deleted',
      );
    }

    if (task.projectDeletedAt) {
      throw new BadRequestException(
        'Cannot restore task because project is deleted',
      );
    }

    await this.uow.runInTransaction(async (manager) => {
      await this.deleteTaskService.restoreTask(
        {
          taskId: input.taskId,
        },
        manager,
      );

      await this.createActivityService.create(
        {
          workspaceId: task.workspaceId,
          projectId: task.projectId,
          entityType: ActivityEntityType.TASK,
          entityId: task.id,
          actorId: input.userId,
          action: ActivityAction.TASK_RESTORED,
        },
        manager,
      );

      this.eventEmitter.emit(REALTIME_EVENTS.TASK_UPDATED, {
        workspaceId: task.workspaceId,
        projectId: task.projectId,
        task: task,
      });
    });
  }
}
