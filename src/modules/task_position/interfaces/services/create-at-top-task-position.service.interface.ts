import { EntityManager } from 'typeorm';
import { TaskPosition } from '../../domain/entities/task_position.entity';
import type { CreateTaskPositionAtEndInput } from '../task-position.input';

export interface CreateAtTopTaskPositionService {
  createAtTop(
    input: CreateTaskPositionAtEndInput,
    manager?: EntityManager,
  ): Promise<TaskPosition>;
}
