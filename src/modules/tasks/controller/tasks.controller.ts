import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ResponseMessage } from 'src/common/decorator/response-message.decorator';
import { CreateTaskDto } from '../dto/create-task.dto';
import { TaskResponseDto } from '../dto/response/task.response.dto';
import { UpdateTaskDto } from '../dto/update-task.dto';
import { type FindTaskApplication } from '../interfaces/applications/find-task.application.interface';
import { TASK_TYPES } from '../interfaces/types';
import { TasksService } from '../tasks.service';

import { Auth } from 'src/common/decorator/auth.decorator';
import { type IAuth } from 'src/types/auth';
import { type CreateTaskApplication } from '../interfaces/applications/create-task.application.interface';

@Controller('tasks')
export class TasksController {
  constructor(
    private readonly tasksService: TasksService,
    @Inject(TASK_TYPES.applications.FindTaskApplication)
    private readonly app: FindTaskApplication,

    @Inject(TASK_TYPES.applications.CreateTaskApplication)
    private readonly createTaskApplication: CreateTaskApplication,
  ) {}

  @Get('/workspace/:workspaceId/project/:projectId/board/:boardId')
  @ResponseMessage('Find all task')
  async findAllByTaskId(
    @Param('projectId') projectId: string,
    @Param('workspaceId') workspaceId: string,
    @Param('boardId') boardId: string,
  ): Promise<TaskResponseDto[]> {
    return await this.app.findAllTask(projectId, workspaceId, boardId);
  }

  @Post()
  @ResponseMessage('Create Task')
  create(@Body() createTaskDto: CreateTaskDto, @Auth() auth: IAuth) {
    return this.createTaskApplication.create({
      ...createTaskDto,
      reporterId: auth.id,
    });
  }

  @Get()
  findAll() {
    return this.tasksService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tasksService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTaskDto: UpdateTaskDto) {
    return this.tasksService.update(+id, updateTaskDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.tasksService.remove(+id);
  }
}
