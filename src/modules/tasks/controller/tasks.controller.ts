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
} from '@nestjs/common';
import { ResponseMessage } from 'src/common/decorator/response-message.decorator';
import { CreateTaskDto } from '../dto/create-task.dto';
import { TaskResponseDto } from '../dto/response/task-response.dto';
import { UpdateTaskDto } from '../dto/update-task.dto';
import { type FindTaskApplication } from '../interfaces/applications/find-task.application.interface';
import { TASK_TYPES } from '../interfaces/types';

import { Auth } from 'src/common/decorator/auth.decorator';
import { type IAuth } from 'src/types/auth';
import { MoveTaskSprintDto } from '../dto/move-task-sprint.dto';
import { type CreateTaskApplication } from '../interfaces/applications/create-task.application.interface';
import { type DeleteTaskApplication } from '../interfaces/applications/delete-task.application.interface';
import { type MoveTaskSprintApplication } from '../interfaces/applications/move-task-sprint.application.interface';
import { type RemoveTaskFromSprintApplication } from '../interfaces/applications/remove-task-sprint.application.interface';
import { type UpdateTaskApplication } from '../interfaces/applications/update-task.application.interface';

@Controller('tasks')
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
  ) {}

  @Get('/workspace/:workspaceId/project/:projectId')
  @ResponseMessage('Find all task')
  async findAllByTaskId(
    @Param('projectId') projectId: string,
    @Param('workspaceId') workspaceId: string,
  ): Promise<TaskResponseDto[]> {
    return await this.app.findAllTask(projectId, workspaceId);
  }

  @Get('/workspace/:workspaceId/project/:projectId/backlog')
  @ResponseMessage('Find all backlog task')
  async findAllBacklogTask(
    @Param('projectId') projectId: string,
    @Param('workspaceId') workspaceId: string,
  ): Promise<TaskResponseDto[]> {
    return await this.app.findBacklogTasks(projectId, workspaceId);
  }

  @Post()
  @ResponseMessage('Create Task')
  create(@Body() createTaskDto: CreateTaskDto, @Auth() auth: IAuth) {
    return this.createTaskApplication.create({
      ...createTaskDto,

      createdBy: auth.id,
    });
  }

  @Patch(':id')
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
  async findDeletedTasks(
    @Query('workspaceId') workspaceId: string,
    @Query('projectId') projectId?: string,
  ) {
    if (!workspaceId) {
      throw new BadRequestException('workspaceId is required');
    }

    return this.findTaskApplication.findDeletedTasks(workspaceId, projectId);
  }

  @Patch(
    'workspaces/:workspaceId/projects/:projectId/sprints/:sprintId/tasks/:taskId/remove',
  )
  @ResponseMessage('Remove task from sprint successfully')
  async removeTaskFromSprint(
    @Param('workspaceId') workspaceId: string,
    @Param('projectId') projectId: string,
    @Param('sprintId') sprintId: string,
    @Param('taskId') taskId: string,
    @Auth() auth: IAuth,
  ): Promise<TaskResponseDto> {
    return this.removeTaskFromSprintApplication.remove({
      workspaceId,
      projectId,
      sprintId,
      taskId,
      userId: auth.id,
    });
  }
}
