import { EntityManager } from 'typeorm';

export interface CheckWorkspaceLimitService {
  checkCanCreateWorkspace(
    userId: string,
    manager?: EntityManager,
  ): Promise<void>;

  applyBillingForNewWorkspace(
    userId: string,
    workspaceId: string,
    manager?: EntityManager,
  ): Promise<void>;
}
