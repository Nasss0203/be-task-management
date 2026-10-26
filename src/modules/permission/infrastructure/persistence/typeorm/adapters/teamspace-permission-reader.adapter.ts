import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import {
  TeamspacePermissionReader,
  TeamspacePermissionResource,
  TeamspacePermissionSubject,
} from 'src/modules/permission/application/ports/teamspace-permission-reader.port';

import { TeamspaceMemberOrmEntity } from 'src/modules/teamspace/infrastructure/persistence/typeorm/entities/teamspace-member.orm-entity';
import { TeamspaceOrmEntity } from 'src/modules/teamspace/infrastructure/persistence/typeorm/entities/teamspace.orm-entity';
import { WorkspaceMembershipType } from 'src/modules/workspace/domain/enums/workspace-membership-type.enum';

@Injectable()
export class TypeOrmTeamspacePermissionReader implements TeamspacePermissionReader {
  constructor(
    @InjectRepository(TeamspaceOrmEntity)
    private readonly teamspaceRepository: Repository<TeamspaceOrmEntity>,

    @InjectRepository(TeamspaceMemberOrmEntity)
    private readonly teamspaceMemberRepository: Repository<TeamspaceMemberOrmEntity>,
  ) {}

  async findTeamspace(
    teamspaceId: string,
  ): Promise<TeamspacePermissionResource | null> {
    const teamspace = await this.teamspaceRepository.createQueryBuilder('teamspace')
      .innerJoin('teamspace.workspace', 'workspace', 'workspace.deleted_at IS NULL')
      .select(['teamspace.id', 'teamspace.workspaceId', 'teamspace.visibility'])
      .where('teamspace.id = :teamspaceId', { teamspaceId })
      .andWhere('teamspace.deleted_at IS NULL')
      .getOne();

    if (!teamspace) {
      return null;
    }

    return {
      id: teamspace.id,
      workspaceId: teamspace.workspaceId,
      visibility: teamspace.visibility,
    };
  }

  async findMembership(
    teamspaceId: string,
    userId: string,
  ): Promise<TeamspacePermissionSubject | null> {
    const membership = await this.teamspaceMemberRepository
      .createQueryBuilder('teamspaceMember')
      .innerJoin('teamspaceMember.workspaceMember', 'workspaceMember')
      .select('teamspaceMember.teamspaceId', 'teamspaceId')
      .addSelect('teamspaceMember.workspaceMemberId', 'workspaceMemberId')
      .addSelect('teamspaceMember.roleName', 'role')
      .addSelect('workspaceMember.workspaceId', 'workspaceId')
      .where('teamspaceMember.teamspaceId = :teamspaceId', {
        teamspaceId,
      })
      .andWhere('workspaceMember.userId = :userId', {
        userId,
      })
      .andWhere('workspaceMember.membershipType = :membershipType', {
        membershipType: WorkspaceMembershipType.MEMBER,
      })
      .getRawOne<TeamspacePermissionSubject>();

    return membership ?? null;
  }
}
