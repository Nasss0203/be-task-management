import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';

import { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';

import { Teamspace } from 'src/modules/teamspace/domain/aggregates/teamspace/teamspace.aggregate';
import type {
  AccessibleTeamspace,
  PrivateTeamspaceSummary,
  TeamspaceRepository,
} from 'src/modules/teamspace/domain/repositories/teamspace.repository';

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
  ): Promise<AccessibleTeamspace[]> {
    const repository = this.getRepo(context);

    const { entities, raw } = await repository
      .createQueryBuilder('teamspace')
      .addSelect('teamspace_member.role_name', 'my_role')

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
            teamspace.visibility = :openVisibility
            OR teamspace_member.id IS NOT NULL
          )
        `,
        {
          openVisibility: TeamspaceVisibility.OPEN,
        },
      )

      .distinct(true)

      .orderBy('teamspace.created_at', 'ASC')

      .getRawAndEntities<{ my_role: TeamspaceRole | null }>();

    return entities.map((entity, index) => ({
      teamspace: TeamspaceMapper.toDomain(entity),
      myRole: raw[index]?.my_role ?? null,
    }));
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
        `(
          teamspace.deleted_by = :userId
          OR teamspace_member.role_name = :teamspaceOwner
          OR (
            workspace_member.role_name = :workspaceOwner
            AND (
              teamspace.visibility = :openVisibility
              OR NOT EXISTS (
                SELECT 1 FROM workspace_members deleter
                WHERE deleter.workspace_id = teamspace.workspace_id
                  AND deleter.user_id = teamspace.deleted_by
                  AND deleter.membership_type = :membershipType
              )
            )
          )
        )`,
        {
          userId,
          workspaceOwner: WorkspaceRole.OWNER,
          teamspaceOwner: TeamspaceRole.OWNER,
          openVisibility: TeamspaceVisibility.OPEN,
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

  async findPrivateSummariesNotJoined(
    workspaceId: string,
    workspaceMemberId: string,
    context?: PersistenceContext,
  ): Promise<PrivateTeamspaceSummary[]> {
    const { entities, raw } = await this.getRepo(context)
      .createQueryBuilder('teamspace')
      .innerJoin('teamspace.workspace', 'workspace', 'workspace.deleted_at IS NULL')
      .addSelect(
        `(
          SELECT COUNT(*)::int
          FROM teamspace_members member
          WHERE member.teamspace_id = teamspace.id
        )`,
        'member_count',
      )
      .addSelect(
        `(
          SELECT COALESCE(array_agg(owner_user.username ORDER BY owner.joined_at, owner.id), '{}')
          FROM teamspace_members owner
          INNER JOIN workspace_members owner_member ON owner_member.id = owner.workspace_member_id
          INNER JOIN users owner_user ON owner_user.id = owner_member.user_id
          WHERE owner.teamspace_id = teamspace.id
            AND owner.role_name = :ownerRole
        )`,
        'owner_names',
      )
      .where('teamspace.workspace_id = :workspaceId', { workspaceId })
      .andWhere('teamspace.deleted_at IS NULL')
      .andWhere('teamspace.visibility = :privateVisibility', {
        privateVisibility: TeamspaceVisibility.PRIVATE,
      })
      .andWhere(
        `NOT EXISTS (
          SELECT 1 FROM teamspace_members own
          WHERE own.teamspace_id = teamspace.id
            AND own.workspace_member_id = :workspaceMemberId
        )`,
        { workspaceMemberId },
      )
      .setParameter('ownerRole', TeamspaceRole.OWNER)
      .orderBy('teamspace.created_at', 'ASC')
      .addOrderBy('teamspace.id', 'ASC')
      .getRawAndEntities<{ member_count: number; owner_names: string[] }>();

    return entities.map((entity, index) => ({
      teamspace: TeamspaceMapper.toDomain(entity),
      ownerNames: raw[index]?.owner_names ?? [],
      memberCount: raw[index]?.member_count ?? 0,
    }));
  }
}
