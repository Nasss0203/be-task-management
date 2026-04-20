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
import { CreateTaskStatusDto } from '../dto/create-task_status.dto';
import { UpdateTaskStatusDto } from '../dto/update-task_status.dto';
import { type FindTaskStatusService } from '../interfaces/services/find.task-status.service.interface';
import { TASK_STATUS_TYPES } from '../interfaces/types';
import { TaskStatusService } from '../task_status.service';

@Controller('task-status')
export class TaskStatusController {
  constructor(
    private readonly taskStatusService: TaskStatusService,

    @Inject(TASK_STATUS_TYPES.services.FindTaskStatusService)
    private readonly findTaskStatusService: FindTaskStatusService,
  ) {}

  @Post()
  create(@Body() createTaskStatusDto: CreateTaskStatusDto) {
    return this.taskStatusService.create(createTaskStatusDto);
  }

  @Get('workspace/:workspaceId/project/:projectId')
  @ResponseMessage('Find all task status')
  findAll(
    @Param('workspaceId') workspaceId: string,
    @Param('projectId') projectId: string,
  ) {
    return this.findTaskStatusService.findAllTaskStatus(projectId, workspaceId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.taskStatusService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateTaskStatusDto: UpdateTaskStatusDto,
  ) {
    return this.taskStatusService.update(+id, updateTaskStatusDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.taskStatusService.remove(+id);
  }
}
