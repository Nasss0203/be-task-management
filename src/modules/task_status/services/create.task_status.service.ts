import { Inject, Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { TaskStatusModel } from '../domain/models/task_status.model';
import { CreateTaskStatusDto } from '../dto/create-task_status.dto';
import { type CreateTaskStatusRepository } from '../interfaces/repositories/create.task_status.repository.interface';
import { CreateTaskStatusService } from '../interfaces/services/create.task_status.service.interface';
import { TASK_STATUS_TYPES } from '../interfaces/types';

@Injectable()
export class CreateTaskStatusServiceImpl implements CreateTaskStatusService {
  constructor(
    @Inject(TASK_STATUS_TYPES.repositories.CreateTaskStatusRepository)
    private readonly repo: CreateTaskStatusRepository,
  ) {}
  create(
    createTaskStatusDto: CreateTaskStatusDto,
    manager: EntityManager,
  ): Promise<TaskStatusModel> {
    const create = this.repo.save(createTaskStatusDto, manager);
    return create;
  }

  async createMany(
    createTaskStatusDtos: CreateTaskStatusDto[],
    manager: EntityManager,
  ): Promise<TaskStatusModel[]> {
    return await this.repo.saveMany(createTaskStatusDtos, manager);
  }
}
