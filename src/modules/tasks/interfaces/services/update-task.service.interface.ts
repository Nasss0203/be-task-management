import { EntityManager } from 'typeorm';
import { TaskModel } from '../../domain/models/task.model';
import { UpdateTaskDto } from '../../dto/update-task.dto';

export interface UpdateTaskService {
  updateTask(
    updateTaskDto: UpdateTaskDto,
    manager?: EntityManager,
  ): Promise<TaskModel>;
}
