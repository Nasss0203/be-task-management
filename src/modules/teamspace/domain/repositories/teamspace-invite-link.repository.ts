import type { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';
import type { TeamspaceInviteLink } from '../entities/teamspace-invite-link.entity';

export interface TeamspaceInviteLinkRepository {
  save(link: TeamspaceInviteLink, context?: PersistenceContext): Promise<TeamspaceInviteLink>;
  findById(id: string, context?: PersistenceContext): Promise<TeamspaceInviteLink | null>;
  findByIdForUpdate(id: string, context: PersistenceContext): Promise<TeamspaceInviteLink | null>;
  findByTokenHash(tokenHash: string, context?: PersistenceContext): Promise<TeamspaceInviteLink | null>;
  findByTeamspaceId(teamspaceId: string, context?: PersistenceContext): Promise<TeamspaceInviteLink[]>;
}
