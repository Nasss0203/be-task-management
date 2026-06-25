import { Body, Controller, Delete, Inject, Param, Post } from '@nestjs/common';
import { Auth } from 'src/common/decorator/auth.decorator';
import { WriteRateLimit } from 'src/common/decorator/rate-limit.decorator';
import { RequirePermissions } from 'src/common/decorator/require-permissions.decorator';
import { ResponseMessage } from 'src/common/decorator/response-message.decorator';
import { WorkspaceContext } from 'src/common/decorator/workspace-context.decorator';
import { PERMISSIONS } from 'src/modules/permission/constants/permission.constant';
import { type IAuth } from 'src/types/auth';
import { CreateTaskAssigneeDto } from '../dto/create-task_assignee.dto';
import { type CreateTaskAssigneeApplication } from '../interfaces/applications/create.task_assignee.application.interface';
import { type DeleteTaskAssigneeApplication } from '../interfaces/applications/delete.task_assignee.application.interface';
import { TASK_ASSIGNEE_TYPES } from '../interfaces/types';

@Controller('task-assignee')
@WriteRateLimit()
export class TaskAssigneeController {
  constructor(
    @Inject(TASK_ASSIGNEE_TYPES.applications.CreateTaskAssigneeApplication)
    private readonly createTaskAssigneeApplication: CreateTaskAssigneeApplication,

    @Inject(TASK_ASSIGNEE_TYPES.applications.DeleteTaskAssigneeApplication)
    private readonly deleteTaskAssigneeApplication: DeleteTaskAssigneeApplication,
  ) {}

  @Post()
  @WorkspaceContext({ source: 'resource', type: 'task', key: 'taskId' })
  @RequirePermissions(PERMISSIONS.TASK_ASSIGNEE_ADD)
  @ResponseMessage('Assign Task')
  async assignTask(@Body() dto: CreateTaskAssigneeDto, @Auth() auth: IAuth) {
    return await this.createTaskAssigneeApplication.assign({
      taskId: dto.taskId,
      userId: dto.userId ?? auth.id,
      assignedBy: auth.id,
    });
  }

  @Delete('task/:taskId/user/:userId')
  @WorkspaceContext({ source: 'resource', type: 'task', key: 'taskId' })
  @RequirePermissions(PERMISSIONS.TASK_ASSIGNEE_REMOVE)
  @ResponseMessage('Unassign Task')
  async unassignTask(
    @Param('taskId') taskId: string,
    @Param('userId') userId: string,
    @Auth() auth: IAuth,
  ) {
    return await this.deleteTaskAssigneeApplication.unassign({
      taskId,
      userId,
      deletedBy: auth.id ?? userId,
    });
  }
}
