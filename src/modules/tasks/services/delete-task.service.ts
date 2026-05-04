import { Inject, Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { type DeleteTaskRepository } from '../interfaces/repositories/delete-task.repository.interface';
import { DeleteTaskService } from '../interfaces/services/delete-task.service.interface';
import { TASK_TYPES } from '../interfaces/types';

@Injectable()
export class DeleteTaskServiceImpl implements DeleteTaskService {
  constructor(
    @Inject(TASK_TYPES.repositories.DeleteTaskRepository)
    private readonly deleteTaskRepository: DeleteTaskRepository,
  ) {}

  softDeleteTask(
    input: {
      taskId: string;
      deletedBy: string;
    },
    manager?: EntityManager,
  ): Promise<void> {
    return this.deleteTaskRepository.softDeleteTask(input, manager);
  }

  restoreTask(
    input: {
      taskId: string;
    },
    manager?: EntityManager,
  ): Promise<void> {
    return this.deleteTaskRepository.restoreTask(input, manager);
  }
}
