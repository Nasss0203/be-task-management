import { EntityManager } from 'typeorm';
import type { NormalizeTaskPositionContextInput } from '../task-position.input';

export interface NormalizeTaskPositionContextService {
  normalizeContext(
    input: NormalizeTaskPositionContextInput,
    manager?: EntityManager,
  ): Promise<void>;
}
