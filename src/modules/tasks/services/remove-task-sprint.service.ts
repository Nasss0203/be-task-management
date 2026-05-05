import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { type FindSprintRepository } from 'src/modules/sprints/interfaces/repositories/find-sprint.repository.interface';
import { SPRINT_TYPES } from 'src/modules/sprints/interfaces/types';
import { EntityManager } from 'typeorm';
import { TaskModel } from '../domain/models/task.model';
import { type FindTaskRepository } from '../interfaces/repositories/find-task.repository.interface';
import { type MoveTaskSprintRepository } from '../interfaces/repositories/move-task-sprint.repository.interface';
import {
  RemoveTaskFromSprintService,
  RemoveTaskFromSprintServiceInput,
} from '../interfaces/services/remove-task-sprint.service.interface';
import { TASK_TYPES } from '../interfaces/types';

@Injectable()
export class RemoveTaskFromSprintServiceImpl implements RemoveTaskFromSprintService {
  constructor(
    @Inject(TASK_TYPES.repositories.FindTaskRepository)
    private readonly findTaskRepository: FindTaskRepository,

    @Inject(TASK_TYPES.repositories.MoveTaskSprintRepository)
    private readonly moveTaskSprintRepository: MoveTaskSprintRepository,

    @Inject(SPRINT_TYPES.repositories.FindSprintRepository)
    private readonly findSprintRepository: FindSprintRepository,
  ) {}

  async remove(
    input: RemoveTaskFromSprintServiceInput,
    manager?: EntityManager,
  ): Promise<TaskModel> {
    const sprint = await this.findSprintRepository.findOneSprint(
      input.sprintId,
      manager,
    );

    if (!sprint) {
      throw new NotFoundException('Sprint not found');
    }

    if (sprint.workspaceId !== input.workspaceId) {
      throw new BadRequestException('Sprint does not belong to this workspace');
    }

    if (sprint.projectId !== input.projectId) {
      throw new BadRequestException('Sprint does not belong to this project');
    }

    const task = await this.findTaskRepository.findOneTask(
      input.taskId,
      manager,
    );

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    if (task.workspaceId !== input.workspaceId) {
      throw new BadRequestException('Task does not belong to this workspace');
    }

    if (task.projectId !== input.projectId) {
      throw new BadRequestException('Task does not belong to this project');
    }

    if (task.sprintId !== input.sprintId) {
      throw new BadRequestException('Task does not belong to this sprint');
    }

    const movedTask = await this.moveTaskSprintRepository.moveTaskToSprint(
      input.taskId,
      null,
      manager,
    );

    if (!movedTask) {
      throw new NotFoundException('Task not found');
    }

    return movedTask;
  }
}
