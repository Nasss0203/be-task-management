import { EntityManager } from 'typeorm';
import { TaskStatusModel } from '../../domain/models/task_status.model';
import { CreateTaskStatusDto } from '../../dto/create-task_status.dto';

export interface CreateTaskStatusService {
  create(
    createTaskStatusDto: CreateTaskStatusDto,
    manager: EntityManager,
  ): Promise<TaskStatusModel>;

  createMany(
    createTaskStatusDtos: CreateTaskStatusDto[],
    manager: EntityManager,
  ): Promise<TaskStatusModel[]>;
}
