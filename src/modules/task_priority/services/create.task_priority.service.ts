import { Inject, Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { TaskPriorityModel } from '../domain/models/task_priority.models';
import { CreateTaskPriorityDto } from '../dto/create-task_priority.dto';
import { type CreateTaskPriorityRepository } from '../interfaces/repositories/create.task_priority.repository.interface';
import { CreateTaskPriorityService } from '../interfaces/services/create.task_priority.service.interface';
import { TASK_PRIORITY_TYPES } from '../interfaces/types';

@Injectable()
export class CreateTaskPriorityServiceImpl implements CreateTaskPriorityService {
  constructor(
    @Inject(TASK_PRIORITY_TYPES.repositories.CreateTaskPriorityRepository)
    private readonly repo: CreateTaskPriorityRepository,
  ) {}
  create(
    createTaskPriorityDto: CreateTaskPriorityDto,
    manager: EntityManager,
  ): Promise<TaskPriorityModel> {
    const create = this.repo.save(createTaskPriorityDto, manager);
    return create;
  }

  async createMany(
    createTaskPriorityDto: CreateTaskPriorityDto[],
    manager: EntityManager,
  ): Promise<TaskPriorityModel[]> {
    return await this.repo.saveMany(createTaskPriorityDto, manager);
  }
}
