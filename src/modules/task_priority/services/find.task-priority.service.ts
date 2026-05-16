import { Inject, Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { TaskPriorityModel } from '../domain/models/task_priority.models';
import { type FindTaskPriorityRepository } from '../interfaces/repositories/find.task-priority.repository.interface';
import { FindTaskPriorityService } from '../interfaces/services/find.task-priority.service.interface';
import { TASK_PRIORITY_TYPES } from '../interfaces/types';

@Injectable()
export class FindTaskPriorityServiceImpl implements FindTaskPriorityService {
  constructor(
    @Inject(TASK_PRIORITY_TYPES.repositories.FindTaskPriorityRepository)
    private readonly findTaskPriorityRepository: FindTaskPriorityRepository,
  ) {}

  async findAllTaskPriority(
    projectId: string,
    workspaceId: string,
    manager?: EntityManager,
  ): Promise<TaskPriorityModel[]> {
    return await this.findTaskPriorityRepository.findAllTaskPriority(
      projectId,
      workspaceId,
      manager,
    );
  }

  async findDonePriority(
    projectId: string,
    workspaceId: string,
    manager?: EntityManager,
  ): Promise<TaskPriorityModel | null> {
    return await this.findTaskPriorityRepository.findDonePriority(
      projectId,
      workspaceId,
      manager,
    );
  }
}
