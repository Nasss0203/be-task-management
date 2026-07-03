import { EntityManager } from 'typeorm';
import { TaskPosition } from '../../domain/entities/task_position.entity';
import type { ReorderTaskPositionInput } from '../task-position.input';

export interface ReorderWithinContextTaskPositionService {
  reorderWithinContext(
    input: ReorderTaskPositionInput,
    manager?: EntityManager,
  ): Promise<TaskPosition>;
}
