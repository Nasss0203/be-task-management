import type { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';

export interface TeamspaceMembershipLock {
  lockForCreation(
    workspaceMemberId: string,
    workspaceId: string,
    context: PersistenceContext,
  ): Promise<void>;

  lockForMembershipChange(
    workspaceMemberId: string,
    teamspaceId: string,
    actorUserId: string,
    context: PersistenceContext,
  ): Promise<void>;
}
