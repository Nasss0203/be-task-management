import { Inject, Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { TaskStatusModel } from '../domain/models/task_status.model';
import { type FindTaskStatusRepository } from '../interfaces/repositories/find.task-status.repository.interface';
import { FindTaskStatusService } from '../interfaces/services/find.task-status.service.interface';
import { TASK_STATUS_TYPES } from '../interfaces/types';

@Injectable()
export class FindTaskStatusServiceImpl implements FindTaskStatusService {
  constructor(
    @Inject(TASK_STATUS_TYPES.repositories.FindTaskStatusRepository)
    private readonly repo: FindTaskStatusRepository,
  ) {}

  async findAllTaskStatus(
    projectId: string,
    workspaceId: string,
    manager?: EntityManager,
  ): Promise<TaskStatusModel[]> {
    return this.repo.findAllTaskStatus(projectId, workspaceId, manager);
  }
}
