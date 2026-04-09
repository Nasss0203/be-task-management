import { Inject, Injectable } from '@nestjs/common';
import { CreateTaskDto } from '../dto/create-task.dto';
import { TaskResponseDto } from '../dto/response/task-response.dto';
import { CreateTaskApplication } from '../interfaces/applications/create-task.application.interface';
import { type CreateTaskService } from '../interfaces/services/create-task.service.interface';
import { TASK_TYPES } from '../interfaces/types';
import { TaskMapper } from '../mapper/tasks.mapper';

@Injectable()
export class CreateTaskApplicationImpl implements CreateTaskApplication {
  constructor(
    @Inject(TASK_TYPES.services.CreateTaskService)
    private readonly service: CreateTaskService,
  ) {}
  async create(createTaskDto: CreateTaskDto): Promise<TaskResponseDto> {
    const model = await this.service.create(createTaskDto);

    return TaskMapper.toResponse(model);
  }
}
