import { Inject, Injectable } from '@nestjs/common';
import { TaskModel } from '../domain/models/task.model';
import { type FindTaskRepository } from '../interfaces/repositories/find-task.repository.interface';
import { FindTaskService } from '../interfaces/services/find-task.service.interface';
import { TASK_TYPES } from '../interfaces/types';

@Injectable()
export class FindTaskServiceImpl implements FindTaskService {
  constructor(
    @Inject(TASK_TYPES.repositories.FindTaskRepository)
    private readonly findTaskRepository: FindTaskRepository,
  ) {}

  async findAllTask(
    projectId: string,
    workspaceId: string,
    boardId: string,
  ): Promise<TaskModel[]> {
    return this.findTaskRepository.findAllTask({
      projectId,
      workspaceId,
      boardId,
    });
  }
}
