import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ROLE_PERMISSION_MAP } from 'src/modules/permission/constants/role-permission-map.constant';
import { WorkspaceRole } from 'src/modules/workspace/domain/enums/workspace-role.enum';
import { PersistenceContext } from 'src/modules/workspace/domain/repositories/persistence-context';
import {
  WorkspaceAccess,
  WorkspaceOverview,
  WorkspaceRepository,
} from 'src/modules/workspace/domain/repositories/workspace.repository';
import { DataSource, EntityManager, IsNull, Not, Repository } from 'typeorm';
import { Workspace } from '../../../../domain/aggregates/workspace/workspace.aggregate';
import { WorkspaceMapper } from '../mappers/workspace.mapper';
import { WorkspaceMemberOrmEntity } from '../entities/workspace-member.orm-entity';
import { WorkspaceOrmEntity } from '../entities/workspace.orm-entity';

type RoleRow = {
  roleName: WorkspaceRole;
};

type MetricsRaw = {
  members: number;
};

@Injectable()
export class TypeOrmWorkspaceRepository implements WorkspaceRepository {
  constructor(
    @InjectRepository(WorkspaceOrmEntity)
    private readonly workspaceRepo: Repository<WorkspaceOrmEntity>,

    @InjectRepository(WorkspaceMemberOrmEntity)
    private readonly workspaceMemberRepo: Repository<WorkspaceMemberOrmEntity>,

    private readonly dataSource: DataSource,
  ) {}

  private resolveManager(
    context?: PersistenceContext,
  ): EntityManager | undefined {
    return context as EntityManager | undefined;
  }

  private getWorkspaceRepo(
    context?: PersistenceContext,
  ): Repository<WorkspaceOrmEntity> {
    const entityManager = this.resolveManager(context);
    return entityManager
      ? entityManager.getRepository(WorkspaceOrmEntity)
      : this.workspaceRepo;
  }

  private getWorkspaceMemberRepo(
    context?: PersistenceContext,
  ): Repository<WorkspaceMemberOrmEntity> {
    const entityManager = this.resolveManager(context);
    return entityManager
      ? entityManager.getRepository(WorkspaceMemberOrmEntity)
      : this.workspaceMemberRepo;
  }

  async existsBySlug(
    slug: string,
    context?: PersistenceContext,
  ): Promise<boolean> {
    return this.getWorkspaceRepo(context).exists({ where: { slug } });
  }

  async save(
    workspace: Workspace,
    context?: PersistenceContext,
  ): Promise<Workspace> {
    const repo = this.getWorkspaceRepo(context);
    const entity = WorkspaceMapper.toOrm(workspace);
    const saved = await repo.save(entity);
    return WorkspaceMapper.toDomain(saved);
  }

  async findByUserId(
    userId: string,
    context?: PersistenceContext,
  ): Promise<Workspace[]> {
    const rows = await this.getWorkspaceMemberRepo(context).find({
      where: {
        userId,
      },
      relations: {
        workspace: true,
      },
      order: {
        lastOpenedAt: 'DESC',
      },
    });

    return rows
      .filter((row) => row.workspace && !row.workspace.deletedAt)
      .map((row) => WorkspaceMapper.toDomain(row.workspace));
  }

  async findByUserIdAndWorkspaceId(
    userId: string,
    workspaceId: string,
    context?: PersistenceContext,
  ): Promise<Workspace | null> {
    const row = await this.getWorkspaceMemberRepo(context).findOne({
      where: {
        userId,
        workspaceId,
      },
      relations: {
        workspace: true,
      },
    });

    if (!row || !row.workspace || row.workspace.deletedAt) {
      return null;
    }

    return WorkspaceMapper.toDomain(row.workspace);
  }

  async findAccess(
    userId: string,
    workspaceId: string,
    context?: PersistenceContext,
  ): Promise<WorkspaceAccess | null> {
    const entityManager =
      this.resolveManager(context) ?? this.dataSource.manager;

    const roleRows = await entityManager.query<RoleRow[]>(
      `
      SELECT role_name AS "roleName"
      FROM workspace_members
      WHERE user_id = $1
        AND workspace_id = $2
      LIMIT 1
      `,
      [userId, workspaceId],
    );

    if (!roleRows.length) {
      return null;
    }

    const roles: string[] = Array.from(
      new Set(roleRows.map((role) => role.roleName)),
    );

    const permissions: string[] = Array.from(
      new Set(roleRows.flatMap((role) => ROLE_PERMISSION_MAP[role.roleName])),
    );

    return {
      userId,
      workspaceId,
      roles,
      permissions,
    };
  }

  async findOverview(
    workspaceId: string,
    context?: PersistenceContext,
  ): Promise<WorkspaceOverview> {
    const db = this.resolveManager(context) ?? this.dataSource.manager;

    const [metricsRaw] = await db.query<MetricsRaw[]>(
      `
        SELECT COUNT(*)::int AS "members"
        FROM workspace_members
        WHERE workspace_id = $1
      `,
      [workspaceId],
    );

    return {
      workspaceId,
      metrics: {
        members: Number(metricsRaw?.members ?? 0),
      },
    };
  }

  async findDeletedByUserId(
    userId: string,
    context?: PersistenceContext,
  ): Promise<Workspace[]> {
    const rows = await this.getWorkspaceMemberRepo(context).find({
      where: {
        userId,
        workspace: {
          deletedAt: Not(IsNull()),
        },
      },
      relations: {
        workspace: true,
      },
      withDeleted: true,
      order: {
        lastOpenedAt: 'DESC',
      },
    });

    return rows
      .filter((row) => row.workspace && row.workspace.deletedAt)
      .map((row) => WorkspaceMapper.toDomain(row.workspace));
  }

  async findDeletedByUserIdAndWorkspaceId(
    userId: string,
    workspaceId: string,
    context?: PersistenceContext,
  ): Promise<Workspace | null> {
    const row = await this.getWorkspaceMemberRepo(context).findOne({
      where: {
        userId,
        workspaceId,
        workspace: {
          deletedAt: Not(IsNull()),
        },
      },
      relations: {
        workspace: true,
      },
      withDeleted: true,
    });

    if (!row?.workspace?.deletedAt) {
      return null;
    }

    return WorkspaceMapper.toDomain(row.workspace);
  }
}
