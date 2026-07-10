import { EntityManager } from 'typeorm';
import { TaskModel } from '../../domain/models/task.model';
import { CreateTaskDto } from '../../dto/create-task.dto';

export type CreateTaskServiceInput = CreateTaskDto & {
  createdBy: string;
  projectSeq?: number;
  parentTaskId?: string | null;
  skipPosition?: boolean;
};

export interface CreateTaskService {
  create(
    input: CreateTaskServiceInput,
    manager?: EntityManager,
  ): Promise<TaskModel>;

  createMany(
    inputs: CreateTaskServiceInput[],
    manager?: EntityManager,
  ): Promise<TaskModel[]>;
}
