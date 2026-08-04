import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { Auth } from 'src/common/decorator/auth.decorator';
import {
  ReadRateLimit,
  WriteRateLimit,
} from 'src/common/decorator/rate-limit.decorator';
import { RequirePermissions } from 'src/common/decorator/require-permissions.decorator';
import { ResponseMessage } from 'src/common/decorator/response-message.decorator';
import { PERMISSIONS } from 'src/modules/permission/constants/permission.constant';
import { type IAuth } from 'src/types/auth';
import { CreateTaskCommnentDto } from '../dto/create-task_commnent.dto';
import { UpdateTaskCommentDto } from '../dto/update-task_comment.dto';
import { type CreateTaskCommentApplication } from '../interfaces/applications/create.task-comment.application.interface';
import { type FindTaskCommentApplication } from '../interfaces/applications/find.task-comment.application.interface';
import { type UpdateTaskCommentApplication } from '../interfaces/applications/update.task-comment.application.interface';
import { type DeleteTaskCommentApplication } from '../interfaces/applications/delete.task-comment.application.interface';
import { TASK_COMMENT_TYPES } from '../interfaces/types';
import { WorkspaceContext } from 'src/common/decorator/workspace-context.decorator';

@Controller('task-commnent')
@ReadRateLimit()
export class TaskCommnentController {
  constructor(
    @Inject(TASK_COMMENT_TYPES.applications.CreateTaskCommentApplication)
    private readonly createTaskCommentApplication: CreateTaskCommentApplication,

    @Inject(TASK_COMMENT_TYPES.applications.FindTaskCommentApplication)
    private readonly findTaskCommentApplication: FindTaskCommentApplication,

    @Inject(TASK_COMMENT_TYPES.applications.UpdateTaskCommentApplication)
    private readonly updateTaskCommentApplication: UpdateTaskCommentApplication,

    @Inject(TASK_COMMENT_TYPES.applications.DeleteTaskCommentApplication)
    private readonly deleteTaskCommentApplication: DeleteTaskCommentApplication,
  ) {}

  @Post('workspaces/:workspaceId/projects/:projectId/tasks/:taskId')
  @WriteRateLimit()
  @WorkspaceContext({ source: 'param', key: 'workspaceId' })
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
  @WorkspaceContext({ source: 'param', key: 'workspaceId' })
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

  @Put('workspaces/:workspaceId/projects/:projectId/tasks/:taskId/:commentId')
  @WriteRateLimit()
  @WorkspaceContext({ source: 'param', key: 'workspaceId' })
  @RequirePermissions(PERMISSIONS.TASK_COMMENT_UPDATE)
  @ResponseMessage('Update task comment successfully')
  async update(
    @Param('workspaceId') workspaceId: string,
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string,
    @Param('commentId') commentId: string,
    @Body() body: UpdateTaskCommentDto,
    @Auth() auth: IAuth,
  ) {
    return await this.updateTaskCommentApplication.update({
      workspaceId,
      projectId,
      taskId,
      commentId,
      userId: auth.id,
      content: body.content,
    });
  }

  @Delete(
    'workspaces/:workspaceId/projects/:projectId/tasks/:taskId/:commentId',
  )
  @WriteRateLimit()
  @WorkspaceContext({ source: 'param', key: 'workspaceId' })
  @RequirePermissions(PERMISSIONS.TASK_COMMENT_DELETE)
  @ResponseMessage('Delete task comment successfully')
  async delete(
    @Param('workspaceId') workspaceId: string,
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string,
    @Param('commentId') commentId: string,
    @Auth() auth: IAuth,
  ) {
    await this.deleteTaskCommentApplication.delete({
      workspaceId,
      projectId,
      taskId,
      commentId,
      userId: auth.id,
    });
    return null;
  }
}
