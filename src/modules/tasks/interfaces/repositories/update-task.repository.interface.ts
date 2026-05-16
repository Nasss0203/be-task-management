import { EntityManager } from 'typeorm';
import { TaskModel } from '../../domain/models/task.model';
import { UpdateManyTasksDto } from '../../dto/update-many-tasks.dto';
import { UpdateTaskDto } from '../../dto/update-task.dto';

export interface UpdateTaskRepository {
  updateTask(
    updateTaskDto: UpdateTaskDto,
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
