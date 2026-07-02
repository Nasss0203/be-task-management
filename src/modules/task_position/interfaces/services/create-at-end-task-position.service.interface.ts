import { EntityManager } from 'typeorm';
import { TaskPosition } from '../../domain/entities/task_position.entity';
import type { CreateTaskPositionAtEndInput } from '../task-position.input';

export interface CreateAtEndTaskPositionService {
  createAtEnd(
    input: CreateTaskPositionAtEndInput,
    manager?: EntityManager,
  ): Promise<TaskPosition>;
}
