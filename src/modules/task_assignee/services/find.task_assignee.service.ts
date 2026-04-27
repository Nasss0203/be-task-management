import { Inject, Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { TaskAssigneeModel } from '../domain/models/task_assignee.model';
import { type FindTaskAssigneeRepository } from '../interfaces/repositories/find.task_assignee.repository.interface';
import { FindTaskAssigneeService } from '../interfaces/services/find.task_assignee.service.interface';
import { TASK_ASSIGNEE_TYPES } from '../interfaces/types';

@Injectable()
export class FindTaskAssigneeServiceImpl implements FindTaskAssigneeService {
  constructor(
    @Inject(TASK_ASSIGNEE_TYPES.repositories.FindTaskAssigneeRepository)
    private readonly repo: FindTaskAssigneeRepository,
  ) {}

  findOneTaskAssignee(
    taskId: string,
    userId: string,
    manager?: EntityManager,
  ): Promise<TaskAssigneeModel | null> {
    return this.repo.findOneTaskAssignee(taskId, userId, manager);
  }
}
