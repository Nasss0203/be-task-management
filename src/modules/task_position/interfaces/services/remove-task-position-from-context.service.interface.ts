import { EntityManager } from 'typeorm';
import type { RemoveTaskPositionInput } from '../task-position.input';

export interface RemoveTaskPositionFromContextService {
  removeFromContext(
    input: RemoveTaskPositionInput,
    manager?: EntityManager,
  ): Promise<void>;
}
