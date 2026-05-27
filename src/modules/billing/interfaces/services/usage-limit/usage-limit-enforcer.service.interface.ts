import { EntityManager } from 'typeorm';

export interface UsageLimitEnforcerService {
  checkProjectLimit(
    workspaceId: string,
    manager?: EntityManager,
  ): Promise<void>;

  syncProjectUsedValue(
    workspaceId: string,
    manager?: EntityManager,
  ): Promise<void>;
}
