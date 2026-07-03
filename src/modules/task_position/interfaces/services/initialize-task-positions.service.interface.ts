import { EntityManager } from 'typeorm';
import type { InitializeTaskPositionsInput } from '../task-position.input';

export interface InitializeTaskPositionsService {
  initializePositions(
    input: InitializeTaskPositionsInput,
    manager?: EntityManager,
  ): Promise<void>;
}
