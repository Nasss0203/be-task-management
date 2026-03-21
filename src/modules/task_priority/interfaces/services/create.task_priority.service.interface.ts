import { EntityManager } from 'typeorm';
import { TaskPriorityModel } from '../../domain/models/task_priority.models';
import { CreateTaskPriorityDto } from '../../dto/create-task_priority.dto';

export interface CreateTaskPriorityService {
  create(
    createTaskPriorityDto: CreateTaskPriorityDto,
    manager: EntityManager,
  ): Promise<TaskPriorityModel>;

  createMany(
    createTaskPriorityDto: CreateTaskPriorityDto[],
    manager: EntityManager,
  ): Promise<TaskPriorityModel[]>;
}
