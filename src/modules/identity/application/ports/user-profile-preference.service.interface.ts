import type { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';

export interface UserProfilePreferenceService {
  getLastActiveWorkspace(
    userId: string,
    context?: PersistenceContext,
  ): Promise<string | null>;

  updateLastActiveWorkspace(
    userId: string,
    workspaceId: string | null,
    context?: PersistenceContext,
  ): Promise<void>;
}
