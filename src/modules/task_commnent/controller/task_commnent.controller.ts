import { Body, Controller, Get, Inject, Param, Post } from '@nestjs/common';
import { Auth } from 'src/common/decorator/auth.decorator';
import { RequirePermissions } from 'src/common/decorator/require-permissions.decorator';
import { ResponseMessage } from 'src/common/decorator/response-message.decorator';
import { PERMISSIONS } from 'src/modules/permission/constants/permission.constant';
import { type IAuth } from 'src/types/auth';
import { CreateTaskCommnentDto } from '../dto/create-task_commnent.dto';
import { type CreateTaskCommentApplication } from '../interfaces/applications/create.task-comment.application.interface';
import { type FindTaskCommentApplication } from '../interfaces/applications/find.task-comment.application.interface';
import { TASK_COMMENT_TYPES } from '../interfaces/types';

@Controller('task-commnent')
export class TaskCommnentController {
  constructor(
    @Inject(TASK_COMMENT_TYPES.applications.CreateTaskCommentApplication)
    private readonly createTaskCommentApplication: CreateTaskCommentApplication,

    @Inject(TASK_COMMENT_TYPES.applications.FindTaskCommentApplication)
    private readonly findTaskCommentApplication: FindTaskCommentApplication,
  ) {}

  @Post('workspaces/:workspaceId/projects/:projectId/tasks/:taskId')
  @RequirePermissions(PERMISSIONS.TASK_COMMENT_CREATE)
  @ResponseMessage('Create task comment successfully')
  async create(
    @Param('workspaceId') workspaceId: string,
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string,
    @Body() body: CreateTaskCommnentDto,
    @Auth() auth: IAuth,
  ) {
    return await this.createTaskCommentApplication.create({
      workspaceId,
      projectId,
      taskId,
      userId: auth.id,
      content: body.content,
    });
  }

  @Get('workspaces/:workspaceId/projects/:projectId/tasks/:taskId')
  @RequirePermissions(PERMISSIONS.TASK_COMMENT_READ)
  @ResponseMessage('Find all task comment successfully')
  async findByTaskId(
    @Param('workspaceId') workspaceId: string,
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string,
    @Auth() auth: IAuth,
  ) {
    return await this.findTaskCommentApplication.findByTaskId({
      workspaceId,
      projectId,
      taskId,
      userId: auth.id,
    });
  }
}
