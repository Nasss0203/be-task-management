import { Inject, Injectable } from '@nestjs/common';
import { TaskResponseDto } from '../dto/response/task-response.dto';
import { UpdateTaskDto } from '../dto/update-task.dto';
import { UpdateTaskApplication } from '../interfaces/applications/update-task.application.interface';
import { type UpdateTaskService } from '../interfaces/services/update-task.service.interface';
import { TASK_TYPES } from '../interfaces/types';
import { TaskMapper } from '../mapper/tasks.mapper';

@Injectable()
export class UpdateTaskApplicationImpl implements UpdateTaskApplication {
  constructor(
    @Inject(TASK_TYPES.services.UpdateTaskService)
    private readonly updateTaskService: UpdateTaskService,
  ) {}

  async updateTask(updateTaskDto: UpdateTaskDto): Promise<TaskResponseDto> {
    const task = await this.updateTaskService.updateTask(updateTaskDto);
    console.log('🚀 ~ task~', task);
    return TaskMapper.toResponse(task);
  }
}
