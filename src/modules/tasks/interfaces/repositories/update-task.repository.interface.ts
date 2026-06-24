import { EntityManager } from 'typeorm';
import { TaskModel } from '../../domain/models/task.model';
import { UpdateManyTasksDto } from '../../dto/update-many-tasks.dto';
import { UpdateTaskInput } from '../applications/update-task.application.interface';

export interface UpdateTaskRepository {
  updateTask(
    updateTaskDto: UpdateTaskInput,
    manager?: EntityManager,
  ): Promise<TaskModel>;

  updateManyTasks(
    input: {
      workspaceId: string;
      projectId: string;
      dto: UpdateManyTasksDto;
    },
    manager?: EntityManager,
  ): Promise<TaskModel[]>;
}
