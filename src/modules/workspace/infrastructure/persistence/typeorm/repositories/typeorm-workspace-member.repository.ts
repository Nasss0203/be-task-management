import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  WorkspaceMember,
  WorkspaceMemberDetail,
} from 'src/modules/workspace/domain/aggregates/workspace-member/workspace-member.aggregate';
import { PersistenceContext } from 'src/modules/workspace/domain/repositories/persistence-context';
import { WorkspaceMemberRepository } from 'src/modules/workspace/domain/repositories/workspace-member.repository';
import { DataSource, EntityManager, IsNull, Not, Repository } from 'typeorm';
import {
  WorkspaceMemberDetailMapper,
  WorkspaceMemberDetailRaw,
} from '../mappers/workspace-member-detail.mapper';
import { WorkspaceMemberMapper } from '../mappers/workspace-member.mapper';
import { WorkspaceMemberOrmEntity } from '../entities/workspace-member.orm-entity';

@Injectable()
export class TypeOrmWorkspaceMemberRepository implements WorkspaceMemberRepository {
  constructor(
    @InjectRepository(WorkspaceMemberOrmEntity)
    private readonly repo: Repository<WorkspaceMemberOrmEntity>,

    private readonly dataSource: DataSource,
  ) {}

  private resolveManager(
    context?: PersistenceContext,
  ): EntityManager | undefined {
    return context as EntityManager | undefined;
  }

  private getRepo(
    context?: PersistenceContext,
  ): Repository<WorkspaceMemberOrmEntity> {
    const entityManager = this.resolveManager(context);
    return entityManager
      ? entityManager.getRepository(WorkspaceMemberOrmEntity)
      : this.repo;
  }

  async save(
    member: WorkspaceMember,
    context?: PersistenceContext,
  ): Promise<WorkspaceMember> {
    const repo = this.getRepo(context);
    const entity = WorkspaceMemberMapper.toOrm(member);
    const saved = await repo.save(entity);

    return WorkspaceMemberMapper.toDomain(saved);
  }

  async findByWorkspaceAndUser(
    workspaceId: string,
    userId: string,
    context?: PersistenceContext,
  ): Promise<WorkspaceMember | null> {
    const row = await this.getRepo(context).findOne({
      where: {
        workspaceId,
        userId,
      },
    });

    return row ? WorkspaceMemberMapper.toDomain(row) : null;
  }

  async findByWorkspace(
    workspaceId: string,
    context?: PersistenceContext,
  ): Promise<WorkspaceMember[]> {
    const rows = await this.getRepo(context).find({
      where: {
        workspaceId,
      },
    });

    return rows.map((row) => WorkspaceMemberMapper.toDomain(row));
  }

  async findDetailByWorkspaceAndUser(
    workspaceId: string,
    userId: string,
    context?: PersistenceContext,
  ): Promise<WorkspaceMemberDetail | null> {
    const repo = this.getRepo(context);

    const raw = await repo
      .createQueryBuilder('uw')
      .innerJoin('users', 'u', 'u.id = uw.user_id')
      .select([
        'uw.id as id',
        'uw.workspace_id as workspace_id',
        'uw.user_id as user_id',
        'u.username as full_name',
        'u.email as email',
        'u.avatar_url as avatar_url',
        'uw.role_name as role_name',
        'uw.last_opened_at as "lastOpenedAt"',
        'uw.joined_at as "joinedAt"',
      ])
      .where('uw.workspace_id = :workspaceId', { workspaceId })
      .andWhere('uw.user_id = :userId', { userId })
      .getRawOne<WorkspaceMemberDetailRaw>();

    if (!raw) return null;

    return WorkspaceMemberDetailMapper.toDomain(raw);
  }

  async findDetailsByWorkspace(
    workspaceId: string,
    context?: PersistenceContext,
  ): Promise<WorkspaceMemberDetail[]> {
    const executor = this.resolveManager(context) ?? this.dataSource.manager;
    const raws = await executor.query<WorkspaceMemberDetailRaw[]>(
      `
        SELECT
          uw.id AS id,
          uw.workspace_id AS workspace_id,
          uw.user_id AS user_id,
          u.username AS full_name,
          u.email AS email,
          u.avatar_url AS avatar_url,
          uw.role_name AS role_name,
          uw.last_opened_at AS "lastOpenedAt",
          uw.joined_at AS "joinedAt"
        FROM workspace_members uw
        INNER JOIN users u
          ON u.id = uw.user_id
        WHERE uw.workspace_id = $1
        GROUP BY
          uw.id,
          uw.workspace_id,
          uw.user_id,
          u.username,
          u.email,
          uw.role_name,
          uw.last_opened_at,
          uw.joined_at
      `,
      [workspaceId],
    );

    return raws.map((raw) => WorkspaceMemberDetailMapper.toDomain(raw));
  }

  async deleteByWorkspaceAndUser(
    workspaceId: string,
    userId: string,
    context?: PersistenceContext,
  ): Promise<void> {
    const repo = this.getRepo(context);
    await repo.delete({ workspaceId, userId });
  }

  async deleteByWorkspaceAndUserIfWorkspaceDeleted(
    workspaceId: string,
    userId: string,
    context?: PersistenceContext,
  ): Promise<void> {
    const repo = this.getRepo(context);

    const membership = await repo.findOne({
      where: {
        workspaceId,
        userId,
        workspace: {
          deletedAt: Not(IsNull()),
        },
      },
      relations: {
        workspace: true,
      },
      withDeleted: true,
    });

    if (membership?.workspace?.deletedAt) {
      await repo.delete({ workspaceId, userId });
    }
  }
}
