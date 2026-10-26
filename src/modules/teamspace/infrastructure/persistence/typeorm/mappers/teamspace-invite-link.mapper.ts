import { TeamspaceInviteLink } from 'src/modules/teamspace/domain/entities/teamspace-invite-link.entity';
import { TeamspaceInviteLinkOrmEntity } from '../entities/teamspace-invite-link.orm-entity';

export class TeamspaceInviteLinkMapper {
  static toDomain(orm: TeamspaceInviteLinkOrmEntity): TeamspaceInviteLink {
    return TeamspaceInviteLink.restore({
      id: orm.id,
      teamspaceId: orm.teamspaceId,
      tokenHash: orm.tokenHash,
      createdBy: orm.createdBy,
      expiresAt: orm.expiresAt,
      maxUses: orm.maxUses,
      useCount: orm.useCount,
      revokedAt: orm.revokedAt,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }

  static toOrm(domain: TeamspaceInviteLink): TeamspaceInviteLinkOrmEntity {
    const orm = new TeamspaceInviteLinkOrmEntity();
    orm.id = domain.getId();
    orm.teamspaceId = domain.getTeamspaceId();
    orm.tokenHash = domain.getTokenHash();
    orm.createdBy = domain.getCreatedBy();
    orm.expiresAt = domain.getExpiresAt();
    orm.maxUses = domain.getMaxUses();
    orm.useCount = domain.getUseCount();
    orm.revokedAt = domain.getRevokedAt();
    orm.createdAt = domain.getCreatedAt();
    orm.updatedAt = domain.getUpdatedAt();
    return orm;
  }
}
