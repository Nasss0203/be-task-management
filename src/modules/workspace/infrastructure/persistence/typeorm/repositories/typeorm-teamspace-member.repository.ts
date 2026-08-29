import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';

import { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';

import { TeamspaceMember } from 'src/modules/workspace/domain/entities/teamspace-member.entity';
import type { TeamspaceMemberRepository } from 'src/modules/workspace/domain/repositories/teamspace-member.repository';

import { TeamspaceMemberOrmEntity } from '../entities/teamspace-member.orm-entity';
import { TeamspaceMemberMapper } from '../mappers/teamspace-member.mapper';

@Injectable()
export class TypeOrmTeamspaceMemberRepository implements TeamspaceMemberRepository {
  constructor(
    @InjectRepository(TeamspaceMemberOrmEntity)
    private readonly repository: Repository<TeamspaceMemberOrmEntity>,
  ) {}

  async save(
    member: TeamspaceMember,
    context?: PersistenceContext,
  ): Promise<TeamspaceMember> {
    const repository = this.getRepository(context);

    const orm = TeamspaceMemberMapper.toOrm(member);

    const saved = await repository.save(orm);

    return TeamspaceMemberMapper.toDomain(saved);
  }

  async findById(
    id: string,
    context?: PersistenceContext,
  ): Promise<TeamspaceMember | null> {
    const repository = this.getRepository(context);

    const orm = await repository.findOne({
      where: {
        id,
      },
    });

    return orm ? TeamspaceMemberMapper.toDomain(orm) : null;
  }

  async findByTeamspaceAndWorkspaceMember(
    teamspaceId: string,
    workspaceMemberId: string,
    context?: PersistenceContext,
  ): Promise<TeamspaceMember | null> {
    const repository = this.getRepository(context);

    const orm = await repository.findOne({
      where: {
        teamspaceId,
        workspaceMemberId,
      },
    });

    return orm ? TeamspaceMemberMapper.toDomain(orm) : null;
  }

  async findByTeamspaceId(
    teamspaceId: string,
    context?: PersistenceContext,
  ): Promise<TeamspaceMember[]> {
    const repository = this.getRepository(context);

    const entities = await repository.find({
      where: {
        teamspaceId,
      },
      order: {
        joinedAt: 'ASC',
      },
    });

    return entities.map((entity) => TeamspaceMemberMapper.toDomain(entity));
  }

  async exists(
    teamspaceId: string,
    workspaceMemberId: string,
    context?: PersistenceContext,
  ): Promise<boolean> {
    const repository = this.getRepository(context);

    return repository.exists({
      where: {
        teamspaceId,
        workspaceMemberId,
      },
    });
  }

  async delete(
    teamspaceId: string,
    workspaceMemberId: string,
    context?: PersistenceContext,
  ): Promise<void> {
    const repository = this.getRepository(context);

    await repository.delete({
      teamspaceId,
      workspaceMemberId,
    });
  }

  private getRepository(
    context?: PersistenceContext,
  ): Repository<TeamspaceMemberOrmEntity> {
    if (!context) {
      return this.repository;
    }

    const manager = context as unknown as EntityManager;

    return manager.getRepository(TeamspaceMemberOrmEntity);
  }
}
