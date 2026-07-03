import { EntityManager } from 'typeorm';
import type { CreateTaskPositionRecordInput } from '../task-position.input';

export interface UpdateManyTaskPositionsRepository {
  updateMany(
    inputs: CreateTaskPositionRecordInput[],
    manager?: EntityManager,
  ): Promise<void>;
}
