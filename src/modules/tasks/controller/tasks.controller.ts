import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  ValidationPipe,
} from '@nestjs/common';
import { ResponseMessage } from 'src/common/decorator/response-message.decorator';
import { CreateTaskDto } from '../dto/create-task.dto';
import { FindBacklogTasksQueryDto } from '../dto/find-backlog-tasks-query.dto';
import {
  PaginatedTaskResponseDto,
  TaskResponseDto,
} from '../dto/response/task-response.dto';
import { UpdateTaskDto } from '../dto/update-task.dto';
import { type FindTaskApplication } from '../interfaces/applications/find-task.application.interface';
import { TASK_TYPES } from '../interfaces/types';

import { Auth } from 'src/common/decorator/auth.decorator';
import {
  ReadRateLimit,
  StrictWriteRateLimit,
  WriteRateLimit,
} from 'src/common/decorator/rate-limit.decorator';
import { RequireFeature } from 'src/common/decorator/require-features.decorator';
import { RequirePermissions } from 'src/common/decorator/require-permissions.decorator';
import { WorkspaceContext } from 'src/common/decorator/workspace-context.decorator';
import { FeatureKey } from 'src/modules/features/constants/feature-key.constant';
import { PERMISSIONS } from 'src/modules/permission/constants/permission.constant';
import { type IAuth } from 'src/types/auth';
import { MoveTaskSprintToSprintDto } from '../dto/move-task-sprint-to-sprint.dto';
import { MoveTaskSprintDto } from '../dto/move-task-sprint.dto';
import { UpdateManyTasksDto } from '../dto/update-many-tasks.dto';
import { type CreateTaskApplication } from '../interfaces/applications/create-task.application.interface';
import { type DeleteTaskApplication } from '../interfaces/applications/delete-task.application.interface';
import { type MoveTaskSprintToSprintApplication } from '../interfaces/applications/move-task-sprint-to-sprint.application.interface';
import { type MoveTaskSprintApplication } from '../interfaces/applications/move-task-sprint.application.interface';
import { type RemoveTaskFromSprintApplication } from '../interfaces/applications/remove-task-sprint.application.interface';
import { type UpdateTaskApplication } from '../interfaces/applications/update-task.application.interface';

@Controller('tasks')
@ReadRateLimit()
export class TasksController {
  constructor(
    @Inject(TASK_TYPES.applications.FindTaskApplication)
    private readonly app: FindTaskApplication,

    @Inject(TASK_TYPES.applications.CreateTaskApplication)
    private readonly createTaskApplication: CreateTaskApplication,

    @Inject(TASK_TYPES.applications.UpdateTaskApplication)
    private readonly updateTaskApplication: UpdateTaskApplication,

    @Inject(TASK_TYPES.applications.MoveTaskSprintApplication)
    private readonly moveTaskSprintApplication: MoveTaskSprintApplication,

    @Inject(TASK_TYPES.applications.DeleteTaskApplication)
    private readonly deleteTaskApplication: DeleteTaskApplication,


    @Inject(TASK_TYPES.applications.FindTaskApplication)
    private readonly findTaskApplication: FindTaskApplication,

    @Inject(TASK_TYPES.applications.RemoveTaskFromSprintApplication)
    private readonly removeTaskFromSprintApplication: RemoveTaskFromSprintApplication,

    @Inject(TASK_TYPES.applications.MoveTaskSprintToSprintApplication)
    private readonly moveTaskSprintToSprintApplication: MoveTaskSprintToSprintApplication,
  ) { }

  @Get('/workspace/:workspaceId/project/:projectId')
  // @WorkspaceContext({ source: 'param', key: 'workspaceId' })
  @RequirePermissions(PERMISSIONS.TASK_READ)
  @ResponseMessage('Find all task')
  async findAllByTask(
    @Param('projectId') projectId: string,
    @Param('workspaceId') workspaceId: string,
    @Query(new ValidationPipe({ transform: true }))
    query: FindBacklogTasksQueryDto,
  ): Promise<TaskResponseDto[]> {
    return await this.app.findAllTask(projectId, workspaceId, query);
  }

  @Get('/workspace/:workspaceId/project/:projectId/backlog')
  @WorkspaceContext({ source: 'param', key: 'workspaceId' })
  @RequireFeature(FeatureKey.SPRINT_ENABLED)
  @RequirePermissions(PERMISSIONS.TASK_READ)
  @ResponseMessage('Find all backlog task')
  async findAllBacklogTask(
    @Param('projectId') projectId: string,
    @Param('workspaceId') workspaceId: string,
    @Query(new ValidationPipe({ transform: true }))
    query: FindBacklogTasksQueryDto,
  ): Promise<PaginatedTaskResponseDto> {
    return await this.app.findBacklogTasks(projectId, workspaceId, query);
  }

  @Post()
  @WriteRateLimit()
  @ResponseMessage('Create task successfully')
  @RequirePermissions(PERMISSIONS.TASK_CREATE)
  create(@Body() createTaskDto: CreateTaskDto, @Auth() auth: IAuth) {
    return this.createTaskApplication.create({
      ...createTaskDto,
      createdBy: auth.id,
    });
  }

  @Patch(':id')
  @WriteRateLimit()
  @WorkspaceContext({ source: 'resource', type: 'task', key: 'id' })
  @RequirePermissions(PERMISSIONS.TASK_UPDATE)
  @ResponseMessage('Update task successfully')
  async updateTask(
    @Param('id') id: string,
    @Body() updateTaskDto: UpdateTaskDto,
    @Auth() auth: IAuth,
  ): Promise<TaskResponseDto> {
    return this.updateTaskApplication.updateTask({
      ...updateTaskDto,
      actorId: auth.id,
      id,
    });
  }

  @Patch(':id/move-sprint')
  @WriteRateLimit()
  @WorkspaceContext({ source: 'resource', type: 'task', key: 'id' })
  @RequireFeature(FeatureKey.SPRINT_ENABLED)
  @RequirePermissions(PERMISSIONS.TASK_UPDATE)
  @ResponseMessage('Move task to sprint successfully')
  async moveTaskToSprint(
    @Param('id') id: string,
    @Body() dto: MoveTaskSprintDto,
    @Auth() auth: IAuth,
  ): Promise<TaskResponseDto> {
    return this.moveTaskSprintApplication.move({
      taskId: id,
      sprintId: dto.sprintId ?? null,
      userId: auth.id,
    });
  }

  @Delete(':taskId')
  @StrictWriteRateLimit()
  @RequirePermissions(PERMISSIONS.TASK_DELETE)
  async deleteTask(
    @Param('taskId') taskId: string,
    @Query('workspaceId') workspaceId: string,
    @Auth() auth: IAuth,
  ) {
    await this.deleteTaskApplication.delete({
      workspaceId,
      taskId,
      userId: auth.id,
    });

    return {
      success: true,
    };
  }

  @Patch(':taskId/restore')
  @StrictWriteRateLimit()
  @RequirePermissions(PERMISSIONS.TASK_DELETE)
  async restoreTask(
    @Param('taskId') taskId: string,
    @Query('workspaceId') workspaceId: string,
    @Auth() auth: IAuth,
  ) {
    await this.deleteTaskApplication.restore({
      workspaceId,
      taskId,
      userId: auth.id,
    });

    return {
      success: true,
    };
  }

  @Get('trash')
  @RequirePermissions(PERMISSIONS.TASK_READ)
  async findDeletedTasks(
    @Query('workspaceId') workspaceId: string,
    @Query('projectId') projectId?: string,
  ) {
    if (!workspaceId) {
      throw new BadRequestException('workspaceId is required');
    }

    return this.findTaskApplication.findDeletedTasks(workspaceId, projectId);
  }

  @Patch(':taskId/remove-sprint')
  @WriteRateLimit()
  @WorkspaceContext({ source: 'resource', type: 'task', key: 'taskId' })
  @RequireFeature(FeatureKey.SPRINT_ENABLED)
  @RequirePermissions(PERMISSIONS.TASK_UPDATE)
  @ResponseMessage('Remove task from sprint successfully')
  async removeTaskFromSprint(
    @Param('taskId') taskId: string,
    @Auth() auth: IAuth,
  ): Promise<TaskResponseDto> {
    return await this.removeTaskFromSprintApplication.remove({
      taskId,
      userId: auth.id,
    });
  }

  @Patch(
    'workspaces/:workspaceId/projects/:projectId/sprints/:sourceSprintId/tasks/:taskId/move-to-sprint',
  )
  @WriteRateLimit()
  @WorkspaceContext({ source: 'param', key: 'workspaceId' })
  @RequireFeature(FeatureKey.SPRINT_ENABLED)
  @RequirePermissions(PERMISSIONS.TASK_UPDATE)
  @ResponseMessage('Move task to sprint successfully')
  async moveTaskSprintToSprint(
    @Param('workspaceId') workspaceId: string,
    @Param('projectId') projectId: string,
    @Param('sourceSprintId') sourceSprintId: string,
    @Param('taskId') taskId: string,
    @Body() dto: MoveTaskSprintToSprintDto,
    @Auth() auth: IAuth,
  ) {
    return await this.moveTaskSprintToSprintApplication.move({
      workspaceId,
      projectId,
      sourceSprintId,
      taskId,
      targetSprintId: dto.targetSprintId,
      userId: auth.id,
    });
  }

  @Patch('workspaces/:workspaceId/projects/:projectId/bulk-update')
  @StrictWriteRateLimit()
  @WorkspaceContext({ source: 'param', key: 'workspaceId' })
  @RequirePermissions(PERMISSIONS.TASK_UPDATE)
  @ResponseMessage('Update many tasks successfully')
  async updateManyTasks(
    @Param('workspaceId') workspaceId: string,
    @Param('projectId') projectId: string,
    @Body() dto: UpdateManyTasksDto,
    @Auth() auth: IAuth,
  ) {
    return await this.updateTaskApplication.updateManyTasks({
      workspaceId,
      projectId,
      actorId: auth.id,
      dto,
    });
  }
}
