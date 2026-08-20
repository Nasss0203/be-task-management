import { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';

export interface FindPermissionService {
  findPermissionsByUserAndWorkspace(
    userId: string,
    workspaceId: string,
    context?: PersistenceContext,
  ): Promise<string[]>;
}
