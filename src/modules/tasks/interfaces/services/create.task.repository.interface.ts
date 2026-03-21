import { EntityManager } from 'typeorm';
import { TaskModel } from '../../domain/models/task.model';
import { CreateTaskDto } from '../../dto/create-task.dto';

export interface CreateTaskService {
  create(
    createTaskDto: CreateTaskDto,
    manager?: EntityManager,
  ): Promise<TaskModel>;
  createMany(
    createTaskDtos: CreateTaskDto[],
    manager: EntityManager,
  ): Promise<TaskModel[]>;
}
