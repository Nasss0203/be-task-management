import { Inject, Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { TaskModel } from '../domain/models/task.model';
import { UpdateManyTasksDto } from '../dto/update-many-tasks.dto';
import { UpdateTaskDto } from '../dto/update-task.dto';
import { type UpdateTaskRepository } from '../interfaces/repositories/update-task.repository.interface';
import { UpdateTaskService } from '../interfaces/services/update-task.service.interface';
import { TASK_TYPES } from '../interfaces/types';

@Injectable()
export class UpdateTaskServiceImpl implements UpdateTaskService {
  constructor(
    @Inject(TASK_TYPES.repositories.UpdateTaskRepository)
    private readonly updateTaskRepository: UpdateTaskRepository,
  ) {}

  async updateTask(
    updateTaskDto: UpdateTaskDto,
    manager?: EntityManager,
  ): Promise<TaskModel> {
    return await this.updateTaskRepository.updateTask(updateTaskDto, manager);
  }

  async updateManyTasks(
    input: {
      workspaceId: string;
      projectId: string;
      dto: UpdateManyTasksDto;
    },
    manager?: EntityManager,
  ): Promise<TaskModel[]> {
    return await this.updateTaskRepository.updateManyTasks(input, manager);
  }
}
