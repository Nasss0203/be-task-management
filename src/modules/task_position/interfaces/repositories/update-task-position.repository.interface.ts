import { EntityManager } from 'typeorm';
import { TaskPosition } from '../../domain/entities/task_position.entity';
import type { CreateTaskPositionRecordInput } from '../task-position.input';

export interface UpdateTaskPositionRepository {
  updatePosition(
    input: CreateTaskPositionRecordInput,
    manager?: EntityManager,
  ): Promise<TaskPosition>;
}
