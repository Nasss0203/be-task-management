import { Inject, Injectable } from '@nestjs/common';
import { DeleteTaskAssigneeResponseDto } from '../dto/response/task_assignee.response.dto';
import {
  DeleteTaskAssigneeApplication,
  DeleteTaskAssigneeApplicationInput,
} from '../interfaces/applications/delete.task_assignee.application.interface';
import { type DeleteTaskAssigneeService } from '../interfaces/services/delete.task_assignee.service.interface';
import { TASK_ASSIGNEE_TYPES } from '../interfaces/types';

@Injectable()
export class DeleteTaskAssigneeApplicationImpl implements DeleteTaskAssigneeApplication {
  constructor(
    @Inject(TASK_ASSIGNEE_TYPES.services.DeleteTaskAssigneeService)
    private readonly deleteTaskAssigneeService: DeleteTaskAssigneeService,
  ) {}

  async unassign(
    input: DeleteTaskAssigneeApplicationInput,
  ): Promise<DeleteTaskAssigneeResponseDto> {
    // TODO: Check task tồn tại
    // TODO: Check user là member trong workspace
    // TODO: Check deletedBy có quyền unassign

    await this.deleteTaskAssigneeService.unassign({
      taskId: input.taskId,
      userId: input.userId,
      deletedBy: input.deletedBy,
    });

    return {
      taskId: input.taskId,
      userId: input.userId,
      unassigned: true,
    };
  }
}
