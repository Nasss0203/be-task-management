import { EntityManager } from 'typeorm';
import { TaskPosition } from '../../domain/entities/task_position.entity';
import type { PositionContextRef } from '../task-position.input';

export interface FindLastTaskPositionRepository {
  findLastInContext(
    input: PositionContextRef,
    manager?: EntityManager,
  ): Promise<TaskPosition | null>;
}
