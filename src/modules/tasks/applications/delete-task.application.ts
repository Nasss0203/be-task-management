import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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

    await this.deleteTaskService.softDeleteTask({
      taskId: input.taskId,
      deletedBy: input.userId,
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

    await this.deleteTaskService.restoreTask({
      taskId: input.taskId,
    });
  }
}
