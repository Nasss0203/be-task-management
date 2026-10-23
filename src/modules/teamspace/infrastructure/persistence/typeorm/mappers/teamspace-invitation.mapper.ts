import { TeamspaceInvitation } from 'src/modules/teamspace/domain/entities/teamspace-invitation.entity';
import { TeamspaceInvitationOrmEntity } from '../entities/teamspace-invitation.orm-entity';

export class TeamspaceInvitationMapper {
  static toDomain(orm: TeamspaceInvitationOrmEntity): TeamspaceInvitation {
    return TeamspaceInvitation.restore({
      id: orm.id,
      teamspaceId: orm.teamspaceId,
      workspaceMemberId: orm.workspaceMemberId,
      invitedBy: orm.invitedBy,
      status: orm.status,
      expiresAt: orm.expiresAt,
      acceptedAt: orm.acceptedAt,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }

  static toOrm(domain: TeamspaceInvitation): TeamspaceInvitationOrmEntity {
    const orm = new TeamspaceInvitationOrmEntity();
    orm.id = domain.getId();
    orm.teamspaceId = domain.getTeamspaceId();
    orm.workspaceMemberId = domain.getWorkspaceMemberId();
    orm.invitedBy = domain.getInvitedBy();
    orm.status = domain.getStatus();
    orm.expiresAt = domain.getExpiresAt();
    orm.acceptedAt = domain.getAcceptedAt();
    orm.createdAt = domain.getCreatedAt();
    orm.updatedAt = domain.getUpdatedAt();
    return orm;
  }
}
