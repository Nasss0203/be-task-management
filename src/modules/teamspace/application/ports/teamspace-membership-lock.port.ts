import type { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';

export interface TeamspaceMembershipLock {
  lockForMembershipChange(
    workspaceMemberId: string,
    teamspaceId: string,
    actorUserId: string,
    context: PersistenceContext,
  ): Promise<void>;
}
