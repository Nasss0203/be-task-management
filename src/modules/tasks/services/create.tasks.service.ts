import { Inject, Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { TaskModel } from '../domain/models/task.model';
import { CreateTaskDto } from '../dto/create-task.dto';
import { type CreateTaskRepository } from '../interfaces/repositories/create.task.repository.interface';
import { CreateTaskService } from '../interfaces/services/create.task.repository.interface';
import { TASK_TYPES } from '../interfaces/types';

@Injectable()
export class CreateTaskServiceImpl implements CreateTaskService {
  constructor(
    @Inject(TASK_TYPES.repositories.CreateTaskRepository)
    private readonly repo: CreateTaskRepository,
  ) {}

  async create(
    createTaskDto: CreateTaskDto,
    manager: EntityManager,
  ): Promise<TaskModel> {
    return await this.repo.save(createTaskDto, manager);
  }

  async createMany(
    createTaskDtos: CreateTaskDto[],
    manager: EntityManager,
  ): Promise<TaskModel[]> {
    return await this.repo.saveMany(createTaskDtos, manager);
  }
}
