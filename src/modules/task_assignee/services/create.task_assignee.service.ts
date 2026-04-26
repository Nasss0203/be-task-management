import { Inject, Injectable } from '@nestjs/common';
import { TaskAssigneeModel } from '../domain/models/task_assignee.model';
import { type CreateTaskAssigneeRepository } from '../interfaces/repositories/create.task_assignee.repository.interface';
import {
  CreateTaskAssigneeService,
  TaskAssigneeInput,
} from '../interfaces/services/create.task_assignee.service.interface';
import { TASK_ASSIGNEE_TYPES } from '../interfaces/types';

@Injectable()
export class CreateTaskAssigneeServiceImpl implements CreateTaskAssigneeService {
  constructor(
    @Inject(TASK_ASSIGNEE_TYPES.repositories.CreateTaskAssigneeRepository)
    private readonly createTaskAssigneeRepository: CreateTaskAssigneeRepository,
  ) {}

  async assign(input: TaskAssigneeInput): Promise<TaskAssigneeModel> {
    return await this.createTaskAssigneeRepository.save({
      taskId: input.taskId,
      userId: input.userId,
      assignedBy: input.assignedBy,
    });
  }
}
