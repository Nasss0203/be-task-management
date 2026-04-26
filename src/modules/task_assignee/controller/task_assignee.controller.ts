import {
  Body,
  Controller,
  Delete,
  Inject,
  Param,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { Auth } from 'src/common/decorator/auth.decorator';
import { ResponseMessage } from 'src/common/decorator/response-message.decorator';
import { type IAuth } from 'src/types/auth';
import { CreateTaskAssigneeDto } from '../dto/create-task_assignee.dto';
import { type CreateTaskAssigneeApplication } from '../interfaces/applications/create.task_assignee.application.interface';
import { type DeleteTaskAssigneeApplication } from '../interfaces/applications/delete.task_assignee.application.interface';
import { TASK_ASSIGNEE_TYPES } from '../interfaces/types';

@Controller('task-assignee')
export class TaskAssigneeController {
  constructor(
    @Inject(TASK_ASSIGNEE_TYPES.applications.CreateTaskAssigneeApplication)
    private readonly createTaskAssigneeApplication: CreateTaskAssigneeApplication,

    @Inject(TASK_ASSIGNEE_TYPES.applications.DeleteTaskAssigneeApplication)
    private readonly deleteTaskAssigneeApplication: DeleteTaskAssigneeApplication,
  ) {}

  @Post('')
  @ResponseMessage('Assign Task')
  assignTask(@Body() dto: CreateTaskAssigneeDto, @Auth() auth: IAuth) {
    return this.createTaskAssigneeApplication.assign({
      taskId: dto.taskId,
      userId: dto.userId,
      assignedBy: auth.id,
    });
  }

  @Delete('task/:taskId/user/:userId')
  @ResponseMessage('Unassign Task')
  unassignTask(
    @Param('taskId') taskId: string,
    @Param('userId') userId: string,
    @Auth() auth: IAuth,
  ) {
    if (!auth.id) {
      throw new UnauthorizedException('User not authenticated');
    }

    return this.deleteTaskAssigneeApplication.unassign({
      taskId,
      userId,
      deletedBy: auth.id,
    });
  }
}
