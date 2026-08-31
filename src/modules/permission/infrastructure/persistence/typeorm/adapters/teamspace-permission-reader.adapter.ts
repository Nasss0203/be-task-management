import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';

import {
  TeamspacePermissionReader,
  TeamspacePermissionResource,
  TeamspacePermissionSubject,
} from 'src/modules/permission/application/ports/teamspace-permission-reader.port';

import { TeamspaceMemberOrmEntity } from 'src/modules/workspace/infrastructure/persistence/typeorm/entities/teamspace-member.orm-entity';
import { TeamspaceOrmEntity } from 'src/modules/workspace/infrastructure/persistence/typeorm/entities/teamspace.orm-entity';

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
    const teamspace = await this.teamspaceRepository.findOne({
      where: {
        id: teamspaceId,
        deletedAt: IsNull(),
      },
      select: {
        id: true,
        workspaceId: true,
        visibility: true,
      },
    });

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
      .getRawOne<TeamspacePermissionSubject>();

    return membership ?? null;
  }
}
