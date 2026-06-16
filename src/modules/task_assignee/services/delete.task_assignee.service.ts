import { Inject, Injectable } from '@nestjs/common';
import { type DeleteTaskAssigneeRepository } from '../interfaces/repositories/delete.task_assignee.repository.interface';
import {
  DeleteTaskAssigneeInput,
  DeleteTaskAssigneeService,
} from '../interfaces/services/delete.task_assignee.service.interface';
import { TASK_ASSIGNEE_TYPES } from '../interfaces/types';

@Injectable()
export class DeleteTaskAssigneeServiceImpl implements DeleteTaskAssigneeService {
  constructor(
    @Inject(TASK_ASSIGNEE_TYPES.repositories.DeleteTaskAssigneeRepository)
    private readonly deleteTaskAssigneeRepository: DeleteTaskAssigneeRepository,
  ) {}

  async unassign(input: DeleteTaskAssigneeInput): Promise<void> {
    return this.deleteTaskAssigneeRepository.deleteByTaskAndUser(
      input.taskId,
      input.userId,
    );
  }

  async unassignFromWorkspace(userId: string, workspaceId: string, manager?: any): Promise<void> {
    return this.deleteTaskAssigneeRepository.deleteByUserAndWorkspace(
      userId,
      workspaceId,
      manager,
    );
  }
}
