import { Inject, Injectable } from '@nestjs/common';
import { TaskModel } from '../domain/models/task.model';
import { type MoveTaskSprintRepository } from '../interfaces/repositories/move-task-sprint.repository.interface';
import {
  MoveTaskSprintService,
  MoveTaskSprintServiceInput,
} from '../interfaces/services/move-task-sprint.service.interface';
import { TASK_TYPES } from '../interfaces/types';

@Injectable()
export class MoveTaskSprintServiceImpl implements MoveTaskSprintService {
  constructor(
    @Inject(TASK_TYPES.repositories.MoveTaskSprintRepository)
    private readonly moveTaskSprintRepository: MoveTaskSprintRepository,
  ) {}

  async move(input: MoveTaskSprintServiceInput): Promise<TaskModel> {
    return await this.moveTaskSprintRepository.moveTaskToSprint(
      input.taskId,
      input.sprintId,
      input.manager,
    );
  }
}
