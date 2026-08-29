import { TeamspaceMember } from 'src/modules/workspace/domain/entities/teamspace-member.entity';

import { TeamspaceMemberOrmEntity } from '../entities/teamspace-member.orm-entity';

export class TeamspaceMemberMapper {
  static toDomain(orm: TeamspaceMemberOrmEntity): TeamspaceMember {
    return TeamspaceMember.restore({
      id: orm.id,
      teamspaceId: orm.teamspaceId,
      workspaceMemberId: orm.workspaceMemberId,
      roleName: orm.roleName,
      joinedAt: orm.joinedAt,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }

  static toOrm(domain: TeamspaceMember): TeamspaceMemberOrmEntity {
    const orm = new TeamspaceMemberOrmEntity();

    orm.id = domain.getId();

    orm.teamspaceId = domain.getTeamspaceId();

    orm.workspaceMemberId = domain.getWorkspaceMemberId();

    orm.roleName = domain.getRoleName();

    orm.joinedAt = domain.getJoinedAt();

    orm.createdAt = domain.getCreatedAt();

    orm.updatedAt = domain.getUpdatedAt();

    return orm;
  }
}
