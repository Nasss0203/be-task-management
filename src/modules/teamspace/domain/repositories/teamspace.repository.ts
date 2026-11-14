import { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';

import { Teamspace } from '../aggregates/teamspace/teamspace.aggregate';
import { TeamspaceRole } from '../enums/teamspace-role.enum';

export interface AccessibleTeamspace {
  teamspace: Teamspace;
  myRole: TeamspaceRole | null;
}

export interface PrivateTeamspaceSummary {
  teamspace: Teamspace;
  ownerNames: string[];
  memberCount: number;
}

export interface TeamspaceRepository {
  save(teamspace: Teamspace, context?: PersistenceContext): Promise<Teamspace>;

  findById(id: string, context?: PersistenceContext): Promise<Teamspace | null>;

  findByWorkspaceId(
    workspaceId: string,
    context?: PersistenceContext,
  ): Promise<Teamspace[]>;

  existsBySlug(
    workspaceId: string,
    slug: string,
    context?: PersistenceContext,
  ): Promise<boolean>;

  findAccessibleByWorkspaceAndUser(
    workspaceId: string,
    userId: string,
    context?: PersistenceContext,
  ): Promise<AccessibleTeamspace[]>;

  /** Archived teamspaces the user may restore: whoever archived it, a teamspace OWNER, or a workspace OWNER for OPEN teamspaces. */
  findArchivedManageableByUser(
    userId: string,
    filter: { workspaceId?: string; teamspaceId?: string },
    context?: PersistenceContext,
  ): Promise<Teamspace[]>;

  findOpenByWorkspaceAndUser(
    workspaceId: string,
    userId: string,
    limit: number,
    offset: number,
    context?: PersistenceContext,
  ): Promise<{ items: Array<{ teamspace: Teamspace; isMember: boolean }>; total: number }>;

  findPrivateSummariesNotJoined(
    workspaceId: string,
    workspaceMemberId: string,
    context?: PersistenceContext,
  ): Promise<PrivateTeamspaceSummary[]>;
}
