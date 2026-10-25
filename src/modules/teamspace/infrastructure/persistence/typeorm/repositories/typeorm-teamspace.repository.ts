import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';

import { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';

import { Teamspace } from 'src/modules/teamspace/domain/aggregates/teamspace/teamspace.aggregate';
import type { TeamspaceRepository } from 'src/modules/teamspace/domain/repositories/teamspace.repository';

import { TeamspaceRole } from 'src/modules/teamspace/domain/enums/teamspace-role.enum';
import { TeamspaceVisibility } from 'src/modules/teamspace/domain/enums/teamspace-visibility.enum';
import { WorkspaceMembershipType } from 'src/modules/workspace/domain/enums/workspace-membership-type.enum';
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

    const orm = await repository.createQueryBuilder('teamspace')
      .innerJoin('teamspace.workspace', 'workspace', 'workspace.deleted_at IS NULL')
      .where('teamspace.id = :id', { id })
      .andWhere('teamspace.deleted_at IS NULL')
      .getOne();

    return orm ? TeamspaceMapper.toDomain(orm) : null;
  }

  async findByWorkspaceId(
    workspaceId: string,
    context?: PersistenceContext,
  ): Promise<Teamspace[]> {
    const repository = this.getRepo(context);

    const entities = await repository.createQueryBuilder('teamspace')
      .innerJoin('teamspace.workspace', 'workspace', 'workspace.deleted_at IS NULL')
      .where('teamspace.workspaceId = :workspaceId', { workspaceId })
      .andWhere('teamspace.deleted_at IS NULL')
      .orderBy('teamspace.createdAt', 'ASC')
      .getMany();

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
          AND workspace_member.membership_type = :membershipType
        `,
        {
          userId,
          membershipType: WorkspaceMembershipType.MEMBER,
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

      .innerJoin('teamspace.workspace', 'workspace', 'workspace.deleted_at IS NULL')

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

    // Archived rows still hold UQ_teamspaces_workspace_slug.
    return repository.exists({
      where: { workspaceId, slug },
      withDeleted: true,
    });
  }

  async findArchivedManageableByUser(
    userId: string,
    filter: { workspaceId?: string; teamspaceId?: string },
    context?: PersistenceContext,
  ): Promise<Teamspace[]> {
    const query = this.getRepo(context)
      .createQueryBuilder('teamspace')
      .withDeleted()
      .innerJoin(
        'teamspace.workspace',
        'workspace',
        'workspace.deleted_at IS NULL',
      )
      .innerJoin(
        'workspace_members',
        'workspace_member',
        `workspace_member.workspace_id = teamspace.workspace_id
         AND workspace_member.user_id = :userId
         AND workspace_member.membership_type = :membershipType`,
        { userId, membershipType: WorkspaceMembershipType.MEMBER },
      )
      .leftJoin(
        'teamspace_members',
        'teamspace_member',
        `teamspace_member.teamspace_id = teamspace.id
         AND teamspace_member.workspace_member_id = workspace_member.id`,
      )
      .where('teamspace.deleted_at IS NOT NULL')
      .andWhere(
        '(workspace_member.role_name = :workspaceOwner OR teamspace_member.role_name = :teamspaceOwner)',
        {
          workspaceOwner: WorkspaceRole.OWNER,
          teamspaceOwner: TeamspaceRole.OWNER,
        },
      );

    if (filter.workspaceId) {
      query.andWhere('teamspace.workspace_id = :workspaceId', {
        workspaceId: filter.workspaceId,
      });
    }
    if (filter.teamspaceId) {
      query.andWhere('teamspace.id = :teamspaceId', {
        teamspaceId: filter.teamspaceId,
      });
    }

    const entities = await query
      .orderBy('teamspace.deleted_at', 'DESC')
      .getMany();

    return entities.map((entity) => TeamspaceMapper.toDomain(entity));
  }

  async findOpenByWorkspaceAndUser(
    workspaceId: string,
    userId: string,
    limit: number,
    offset: number,
    context?: PersistenceContext,
  ): Promise<{ items: Array<{ teamspace: Teamspace; isMember: boolean }>; total: number }> {
    const query = this.getRepo(context)
      .createQueryBuilder('teamspace')
      .innerJoin(
        'workspace_members',
        'workspace_member',
        `workspace_member.workspace_id = teamspace.workspace_id
         AND workspace_member.user_id = :userId
         AND workspace_member.membership_type = :membershipType`,
        { userId, membershipType: WorkspaceMembershipType.MEMBER },
      )
      .leftJoin(
        'teamspace_members',
        'teamspace_member',
        `teamspace_member.teamspace_id = teamspace.id
         AND teamspace_member.workspace_member_id = workspace_member.id`,
      )
      .where('teamspace.workspace_id = :workspaceId', { workspaceId })
      .innerJoin('teamspace.workspace', 'workspace', 'workspace.deleted_at IS NULL')
      .andWhere('teamspace.visibility = :visibility', { visibility: TeamspaceVisibility.OPEN })
      .andWhere('teamspace.deleted_at IS NULL');

    const total = await query.clone().getCount();
    const { entities, raw } = await query
      .addSelect('teamspace_member.id', 'membership_id')
      .orderBy('teamspace.created_at', 'ASC')
      .addOrderBy('teamspace.id', 'ASC')
      .skip(offset)
      .take(limit)
      .getRawAndEntities();

    return {
      items: entities.map((entity, index) => ({
        teamspace: TeamspaceMapper.toDomain(entity),
        isMember: raw[index]?.membership_id !== null && raw[index]?.membership_id !== undefined,
      })),
      total,
    };
  }
}
