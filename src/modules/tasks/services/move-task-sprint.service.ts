import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { TaskModel } from '../domain/models/task.model';
import { type FindTaskRepository } from '../interfaces/repositories/find-task.repository.interface';
import { type MoveTaskSprintRepository } from '../interfaces/repositories/move-task-sprint.repository.interface';
import {
  MoveManyTaskSprintServiceInput,
  MoveTaskSprintService,
  MoveTaskSprintServiceInput,
} from '../interfaces/services/move-task-sprint.service.interface';
import { TASK_TYPES } from '../interfaces/types';

@Injectable()
export class MoveTaskSprintServiceImpl implements MoveTaskSprintService {
  constructor(
    @Inject(TASK_TYPES.repositories.MoveTaskSprintRepository)
    private readonly moveTaskSprintRepository: MoveTaskSprintRepository,

    @Inject(TASK_TYPES.repositories.FindTaskRepository)
    private readonly findTaskRepository: FindTaskRepository,
  ) {}

  async move(input: MoveTaskSprintServiceInput): Promise<TaskModel> {
    return await this.moveTaskSprintRepository.moveTaskToSprint(
      input.taskId,
      input.sprintId,
      input.manager,
    );
  }

  async moveMany(input: MoveManyTaskSprintServiceInput): Promise<void> {
    const uniqueTaskIds = [...new Set(input.taskIds)];

    if (uniqueTaskIds.length === 0) {
      return;
    }

    const tasks = await this.findTaskRepository.findByIds(
      uniqueTaskIds,
      input.manager,
    );

    if (tasks.length !== uniqueTaskIds.length) {
      throw new NotFoundException('Some tasks were not found');
    }

    for (const task of tasks) {
      if (task.workspaceId !== input.workspaceId) {
        throw new BadRequestException(
          `Task ${task.id} does not belong to this workspace`,
        );
      }

      if (task.projectId !== input.projectId) {
        throw new BadRequestException(
          `Task ${task.id} does not belong to this project`,
        );
      }
    }

    await this.moveTaskSprintRepository.moveManyTaskToSprint(
      uniqueTaskIds,
      input.sprintId,
      input.manager,
    );
  }
}
