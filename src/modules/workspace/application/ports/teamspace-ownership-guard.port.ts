import type { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';

export interface TeamspaceOwnershipGuard {
  assertCanRemoveWorkspaceMember(
    workspaceId: string,
    workspaceMemberId: string,
    context: PersistenceContext,
  ): Promise<void>;
}
