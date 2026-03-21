import { Inject, Injectable } from '@nestjs/common';
import { type CreateTaskPriorityService } from 'src/modules/task_priority/interfaces/services/create.task_priority.service.interface';
import { TASK_PRIORITY_TYPES } from 'src/modules/task_priority/interfaces/types';
import { type CreateTaskStatusService } from 'src/modules/task_status/interfaces/services/create.task_status.service.interface';
import { TASK_STATUS_TYPES } from 'src/modules/task_status/interfaces/types';
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

    @Inject(TASK_PRIORITY_TYPES.services.CreateTaskPriorityService)
    private readonly createTaskPriorityService: CreateTaskPriorityService,
    @Inject(TASK_STATUS_TYPES.services.CreateTaskStatusService)
    private readonly createTaskStatusService: CreateTaskStatusService,
  ) {}

  async create(
    createTaskDto: CreateTaskDto,
    manager: EntityManager,
  ): Promise<TaskModel> {
    return await this.repo.save(
      {
        ...createTaskDto,
      },
      manager,
    );
  }

  async createMany(
    createTaskDtos: CreateTaskDto[],
    manager: EntityManager,
  ): Promise<TaskModel[]> {
    return await this.repo.saveMany(createTaskDtos, manager);
  }
}
