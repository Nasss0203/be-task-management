import type { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';
import type { TeamspaceInvitation } from '../entities/teamspace-invitation.entity';

export interface TeamspaceInvitationRepository {
  save(invitation: TeamspaceInvitation, context?: PersistenceContext): Promise<TeamspaceInvitation>;
  findById(id: string, context?: PersistenceContext): Promise<TeamspaceInvitation | null>;
  findPendingByTeamspaceAndWorkspaceMember(
    teamspaceId: string,
    workspaceMemberId: string,
    context?: PersistenceContext,
  ): Promise<TeamspaceInvitation | null>;
  findByRecipientUserId(userId: string, context?: PersistenceContext): Promise<TeamspaceInvitation[]>;
}
