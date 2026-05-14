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
    const task = await this.findTaskRepository.findOneTask(
      input.taskId,
      manager,
    );

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    if (!task.sprintId) {
      throw new BadRequestException('Task is already in backlog');
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
