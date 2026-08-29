import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, IsNull, Repository } from 'typeorm';

import { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';

import { Teamspace } from 'src/modules/workspace/domain/aggregates/teamspace/teamspace.aggregate';
import type { TeamspaceRepository } from 'src/modules/workspace/domain/repositories/teamspace.repository';

import { TeamspaceVisibility } from 'src/modules/workspace/domain/enums/teamspace-visibility.enum';
import { WorkspaceRole } from 'src/modules/workspace/domain/enums/workspace-role.enum';

import { TeamspaceOrmEntity } from '../entities/teamspace.orm-entity';
import { TeamspaceMapper } from '../mappers/teamspace.mapper';

@Injectable()
export class TypeOrmTeamspaceRepository implements TeamspaceRepository {
  constructor(
    @InjectRepository(TeamspaceOrmEntity)
    private readonly repository: Repository<TeamspaceOrmEntity>,
  ) {}

  private resolveManager(
    context?: PersistenceContext,
  ): EntityManager | undefined {
    return context as EntityManager | undefined;
  }

  private getRepo(
    context?: PersistenceContext,
  ): Repository<TeamspaceOrmEntity> {
    const entityManager = this.resolveManager(context);

    return entityManager
      ? entityManager.getRepository(TeamspaceOrmEntity)
      : this.repository;
  }

  async save(
    teamspace: Teamspace,
    context?: PersistenceContext,
  ): Promise<Teamspace> {
    const repository = this.getRepo(context);

    const orm = TeamspaceMapper.toOrm(teamspace);

    const saved = await repository.save(orm);

    return TeamspaceMapper.toDomain(saved);
  }

  async findById(
    id: string,
    context?: PersistenceContext,
  ): Promise<Teamspace | null> {
    const repository = this.getRepo(context);

    const orm = await repository.findOne({
      where: {
        id,
        deletedAt: IsNull(),
      },
    });

    return orm ? TeamspaceMapper.toDomain(orm) : null;
  }

  async findByWorkspaceId(
    workspaceId: string,
    context?: PersistenceContext,
  ): Promise<Teamspace[]> {
    const repository = this.getRepo(context);

    const entities = await repository.find({
      where: {
        workspaceId,
        deletedAt: IsNull(),
      },
      order: {
        createdAt: 'ASC',
      },
    });

    return entities.map((entity) => TeamspaceMapper.toDomain(entity));
  }

  async findAccessibleByWorkspaceAndUser(
    workspaceId: string,
    userId: string,
    context?: PersistenceContext,
  ): Promise<Teamspace[]> {
    const repository = this.getRepo(context);

    const entities = await repository
      .createQueryBuilder('teamspace')

      .innerJoin(
        'workspace_members',
        'workspace_member',
        `
          workspace_member.workspace_id = teamspace.workspace_id
          AND workspace_member.user_id = :userId
        `,
        {
          userId,
        },
      )

      .leftJoin(
        'teamspace_members',
        'teamspace_member',
        `
          teamspace_member.teamspace_id = teamspace.id
          AND teamspace_member.workspace_member_id = workspace_member.id
        `,
      )

      .where('teamspace.workspace_id = :workspaceId', {
        workspaceId,
      })

      .andWhere('teamspace.deleted_at IS NULL')

      .andWhere(
        `
          (
            workspace_member.role_name = :workspaceOwner
            OR teamspace.visibility = :openVisibility
            OR teamspace_member.id IS NOT NULL
          )
        `,
        {
          workspaceOwner: WorkspaceRole.OWNER,
          openVisibility: TeamspaceVisibility.OPEN,
        },
      )

      .distinct(true)

      .orderBy('teamspace.created_at', 'ASC')

      .getMany();

    return entities.map((entity) => TeamspaceMapper.toDomain(entity));
  }

  async existsBySlug(
    workspaceId: string,
    slug: string,
    context?: PersistenceContext,
  ): Promise<boolean> {
    const repository = this.getRepo(context);

    return repository.exists({
      where: {
        workspaceId,
        slug,
        deletedAt: IsNull(),
      },
    });
  }
}
