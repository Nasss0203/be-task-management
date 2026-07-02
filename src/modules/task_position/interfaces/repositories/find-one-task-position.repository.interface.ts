import { EntityManager } from 'typeorm';
import { TaskPosition } from '../../domain/entities/task_position.entity';
import type { TaskPositionRef } from '../task-position.input';

export interface FindOneTaskPositionRepository {
  findOneByTaskAndContext(
    input: TaskPositionRef,
    manager?: EntityManager,
  ): Promise<TaskPosition | null>;
}
