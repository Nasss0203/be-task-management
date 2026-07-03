import { EntityManager } from 'typeorm';
import type { TaskPositionRef } from '../task-position.input';

export interface DeleteTaskPositionRepository {
  deleteByTaskAndContext(
    input: TaskPositionRef,
    manager?: EntityManager,
  ): Promise<void>;
}
