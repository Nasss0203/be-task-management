import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  ValidationPipe,
} from '@nestjs/common';
import { ResponseMessage } from 'src/common/decorator/response-message.decorator';
import { CreateTaskPositionDto } from '../dto/create-task_position.dto';
import { ReorderTaskPositionDto } from '../dto/reorder-task_position.dto';
import { TaskPositionResponseDto } from '../dto/response/task_position.response.dto';
import { UpdateTaskPositionDto } from '../dto/update-task_position.dto';
import { type ReorderWithinContextTaskPositionService } from '../interfaces/services/reorder-within-context-task-position.service.interface';
import { TASK_POSITION_TYPES } from '../interfaces/types';
import { TaskPositionMapper } from '../mapper/task_position.mapper';
import { TaskPositionService } from '../services/task_position.service';

@Controller('task-position')
export class TaskPositionController {
  constructor(
    private readonly taskPositionService: TaskPositionService,
    @Inject(TASK_POSITION_TYPES.services.ReorderWithinContextTaskPositionService)
    private readonly reorderWithinContextService: ReorderWithinContextTaskPositionService,
  ) {}

  @Post()
  create(@Body() createTaskPositionDto: CreateTaskPositionDto) {
    return this.taskPositionService.create(createTaskPositionDto);
  }

  @Get()
  findAll() {
    return this.taskPositionService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.taskPositionService.findOne(id);
  }

  @Patch('reorder')
  @ResponseMessage('Reorder task position successfully')
  async reorder(
    @Body(new ValidationPipe({ transform: true }))
    dto: ReorderTaskPositionDto,
  ): Promise<TaskPositionResponseDto> {
    const position = await this.reorderWithinContextService.reorderWithinContext(
      {
        taskId: dto.taskId,
        context: dto.context,
        contextId: dto.contextId,
        previousTaskId: dto.previousTaskId ?? null,
        nextTaskId: dto.nextTaskId ?? null,
      },
    );

    return TaskPositionMapper.toResponse(TaskPositionMapper.toModel(position));
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateTaskPositionDto: UpdateTaskPositionDto,
  ) {
    return this.taskPositionService.update(id, updateTaskPositionDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.taskPositionService.remove(id);
  }
}
