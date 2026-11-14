import type { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';

export interface TeamspaceHandover {
  teamspaceId: string;
  teamspaceName: string;
  newOwnerUserId: string | null;
  newOwnerWorkspaceMemberId: string | null;
}

export interface TeamspaceOwnershipGuard {
  assertCanRemoveWorkspaceMember(
    workspaceId: string,
    workspaceMemberId: string,
    context: PersistenceContext,
  ): Promise<void>;

  handOverTeamspacesOf(
    workspaceId: string,
    workspaceMemberId: string,
    removedUserId: string,
    context: PersistenceContext,
  ): Promise<TeamspaceHandover[]>;
}
