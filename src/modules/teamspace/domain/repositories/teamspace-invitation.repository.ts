import type { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';
import type { TeamspaceInvitation } from '../entities/teamspace-invitation.entity';
import type { TeamspaceInvitationStatus } from '../enums/teamspace-invitation-status.enum';

export interface TeamspaceInvitationRepository {
  save(invitation: TeamspaceInvitation, context?: PersistenceContext): Promise<TeamspaceInvitation>;
  findById(id: string, context?: PersistenceContext): Promise<TeamspaceInvitation | null>;
  findByIdForUpdate(id: string, context: PersistenceContext): Promise<TeamspaceInvitation | null>;
  findPendingByTeamspaceAndWorkspaceMember(
    teamspaceId: string,
    workspaceMemberId: string,
    context?: PersistenceContext,
  ): Promise<TeamspaceInvitation | null>;
  findPendingByTeamspaceAndWorkspaceMemberForUpdate(
    teamspaceId: string,
    workspaceMemberId: string,
    context: PersistenceContext,
  ): Promise<TeamspaceInvitation | null>;
  listByTeamspace(params: {
    teamspaceId: string;
    status?: TeamspaceInvitationStatus;
    page: number;
    limit: number;
    now: Date;
  }): Promise<{ invitations: TeamspaceInvitation[]; total: number }>;
  findByRecipientUserId(userId: string, context?: PersistenceContext): Promise<RecipientTeamspaceInvitation[]>;
}

/** Invitation plus the display names its recipient needs to decide. */
export interface RecipientTeamspaceInvitation {
  invitation: TeamspaceInvitation;
  teamspaceName: string;
  teamspaceIcon: string | null;
  workspaceId: string;
  workspaceName: string;
  inviterName: string | null;
}
