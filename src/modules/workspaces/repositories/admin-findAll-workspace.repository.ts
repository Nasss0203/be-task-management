import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  AdminWorkspaceStatus,
  PaginatedAdminWorkspaceResponseDto,
} from 'src/modules/admin/dto/response/dashboard/workspace-overview.response.dto';
import { SystemRole } from 'src/modules/users/domain/entities/user.entity';
import { EntityManager, Repository } from 'typeorm';
import { AdminWorkspaceStatus as AdminWorkspaceStatusFilter } from '../dto/search-workspace.dto';
import {
  PlanTypeWorkspace,
  Workspace,
} from '../domain/entities/workspace.entity';
import { AdminFindAllWorkspaceRepository } from '../interfaces/repositories/admin-findAll-workspace.repository.interface';
import { AdminFindAllWorkspaceFilter } from '../interfaces/workspace-filter.type';

type AdminWorkspaceRaw = {
  id: string;
  name: string;
  slug: string;
  plan: PlanTypeWorkspace;
  planName: string | null;
  planSlug: string | null;
  status: AdminWorkspaceStatus;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  ownerName: string | null;
  ownerEmail: string | null;
};

type CountRaw = {
  count: string;
};

type WorkspaceAggregateRaw = {
  workspaceId: string;
  count: string;
};

type WorkspaceCountMaps = {
  members: Map<string, number>;
  projects: Map<string, number>;
  boards: Map<string, number>;
  tasks: Map<string, number>;
};

@Injectable()
export class AdminFindAllWorkspaceRepositoryImpl
  implements AdminFindAllWorkspaceRepository
{
  constructor(
    @InjectRepository(Workspace)
    private readonly repo: Repository<Workspace>,
  ) {}

  private getRepo(manager?: EntityManager): Repository<Workspace> {
    return manager ? manager.getRepository(Workspace) : this.repo;
  }

  private normalizePaginationValue(
    value: number | string | undefined,
    defaultValue: number,
    maxValue?: number,
  ): number {
    if (value === undefined || value === null || value === '') {
      return defaultValue;
    }

    const numericValue = Number(value);

    if (!Number.isFinite(numericValue) || numericValue < 1) {
      return defaultValue;
    }

    const normalizedValue = Math.floor(numericValue);

    if (maxValue !== undefined) {
      return Math.min(normalizedValue, maxValue);
    }

    return normalizedValue;
  }

  async findAllWorkspace(
    filter: AdminFindAllWorkspaceFilter,
    manager?: EntityManager,
  ): Promise<PaginatedAdminWorkspaceResponseDto> {
    const page = this.normalizePaginationValue(filter.page, 1);
    const pageSize = this.normalizePaginationValue(filter.pageSize, 10, 100);
    const baseQb = this.buildBaseWorkspaceQuery(filter, manager);

    const totalRaw = await baseQb
      .clone()
      .select('COUNT(DISTINCT "workspace"."id")', 'count')
      .getRawOne<CountRaw>();
    const total = Number(totalRaw?.count ?? 0);

    const rows = await baseQb
      .clone()
      .select('"workspace"."id"', 'id')
      .addSelect('"workspace"."name"', 'name')
      .addSelect('"workspace"."slug"', 'slug')
      .addSelect(
        `CASE
          WHEN MAX("activePlan"."slug") IS NULL THEN "workspace"."plan_type"
          WHEN MAX("activePlan"."slug") = 'free' THEN 'free'
          ELSE 'pro'
        END`,
        'plan',
      )
      .addSelect(
        `COALESCE(
          MAX("activePlan"."name"),
          INITCAP("workspace"."plan_type"::text)
        )`,
        'planName',
      )
      .addSelect(
        `COALESCE(MAX("activePlan"."slug"), "workspace"."plan_type"::text)`,
        'planSlug',
      )
      .addSelect('"workspace"."created_at"', 'createdAt')
      .addSelect('"workspace"."updated_at"', 'updatedAt')
      .addSelect('"workspace"."deleted_at"', 'deletedAt')
      .addSelect(
        `CASE 
          WHEN "workspace"."deleted_at" IS NULL THEN 'ACTIVE'
          ELSE 'DELETED'
        END`,
        'status',
      )
      .addSelect(
        `COALESCE(
          MAX("ownerProfile"."full_name"),
          MAX("ownerProfile"."display_name"),
          MAX("ownerUser"."username"),
          MAX("ownerUser"."email")
        )`,
        'ownerName',
      )
      .addSelect('MAX("ownerUser"."email")', 'ownerEmail')
      .groupBy('"workspace"."id"')
      .orderBy('"workspace"."created_at"', 'DESC')
      .offset((page - 1) * pageSize)
      .limit(pageSize)
      .getRawMany<AdminWorkspaceRaw>();

    const countMaps = await this.getWorkspaceCountMaps(
      rows.map((row) => row.id),
      manager,
    );

    return {
      data: rows.map((row) => ({
        id: row.id,
        name: row.name,
        slug: row.slug,
        plan: row.plan,
        planName: row.planName ?? row.plan,
        planSlug: row.planSlug ?? row.plan,
        status: row.status,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        deletedAt: row.deletedAt,
        ownerName: row.ownerName,
        ownerEmail: row.ownerEmail,
        membersCount: countMaps.members.get(row.id) ?? 0,
        projectsCount: countMaps.projects.get(row.id) ?? 0,
        boardsCount: countMaps.boards.get(row.id) ?? 0,
        tasksCount: countMaps.tasks.get(row.id) ?? 0,
      })),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  private buildBaseWorkspaceQuery(
    filter: AdminFindAllWorkspaceFilter,
    manager?: EntityManager,
  ) {
    const qb = this.getRepo(manager)
      .createQueryBuilder('workspace')
      .withDeleted()
      .leftJoin('user_roles', 'ur', 'ur.workspace_id = workspace.id')
      .leftJoin('roles', 'role', 'role.id = ur.role_id')
      .leftJoin(
        'users',
        'ownerUser',
        'ownerUser.id = ur.user_id AND role.name = :ownerRole',
        { ownerRole: 'OWNER' },
      )
      .leftJoin(
        'user_profiles',
        'ownerProfile',
        'ownerProfile.user_id = ownerUser.id',
      )
      .leftJoin(
        'subscription_workspaces',
        'subscription_workspace',
        'subscription_workspace.workspace_id = workspace.id',
      )
      .leftJoin(
        'subscriptions',
        'subscription',
        `subscription.id = subscription_workspace.subscription_id
          AND subscription.status IN (:...activeSubscriptionStatuses)
          AND (
            subscription.current_period_end IS NULL
            OR subscription.current_period_end >= :now
          )`,
        {
          activeSubscriptionStatuses: ['ACTIVE', 'TRIALING'],
          now: new Date(),
        },
      )
      .leftJoin(
        'plans',
        'activePlan',
        'activePlan.id = subscription.plan_id AND activePlan.is_active = true',
      );

    qb.andWhere(
      `NOT EXISTS (
        SELECT 1
        FROM "user_roles" "superAdminUserRole"
        INNER JOIN "roles" "superAdminOwnerRole"
          ON "superAdminOwnerRole"."id" = "superAdminUserRole"."role_id"
        INNER JOIN "users" "superAdminOwner"
          ON "superAdminOwner"."id" = "superAdminUserRole"."user_id"
        WHERE "superAdminUserRole"."workspace_id" = "workspace"."id"
          AND "superAdminOwnerRole"."name" = :ownerRole
          AND "superAdminOwner"."system_role" = :superAdminRole
      )`,
      {
        ownerRole: 'OWNER',
        superAdminRole: SystemRole.SUPER_ADMIN,
      },
    );

    if (filter.search?.trim()) {
      qb.andWhere(
        `(
          "workspace"."name" ILIKE :search
          OR "workspace"."slug" ILIKE :search
          OR "ownerUser"."email" ILIKE :search
          OR "ownerUser"."username" ILIKE :search
          OR "ownerProfile"."full_name" ILIKE :search
          OR "ownerProfile"."display_name" ILIKE :search
        )`,
        {
          search: `%${filter.search.trim()}%`,
        },
      );
    }

    if (filter.plan === PlanTypeWorkspace.FREE) {
      qb.andWhere(
        `(
          "workspace"."plan_type" = :freePlan
          AND (
            "activePlan"."slug" IS NULL
            OR "activePlan"."slug" = :freePlan
          )
        )`,
        {
          freePlan: PlanTypeWorkspace.FREE,
        },
      );
    }

    if (filter.plan === PlanTypeWorkspace.PRO) {
      qb.andWhere(
        `(
          "workspace"."plan_type" = :proPlan
          OR (
            "activePlan"."slug" IS NOT NULL
            AND "activePlan"."slug" <> :freePlan
          )
        )`,
        {
          proPlan: PlanTypeWorkspace.PRO,
          freePlan: PlanTypeWorkspace.FREE,
        },
      );
    }

    if (filter.status === AdminWorkspaceStatusFilter.ACTIVE) {
      qb.andWhere('"workspace"."deleted_at" IS NULL');
    }

    if (filter.status === AdminWorkspaceStatusFilter.DELETED) {
      qb.andWhere('"workspace"."deleted_at" IS NOT NULL');
    }

    if (filter.createdAt) {
      const startOfDay = new Date(filter.createdAt);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(filter.createdAt);
      endOfDay.setHours(23, 59, 59, 999);

      qb.andWhere(
        '"workspace"."created_at" BETWEEN :startOfDay AND :endOfDay',
        {
          startOfDay,
          endOfDay,
        },
      );
    } else {
      if (filter.createdFrom) {
        const createdFrom = new Date(filter.createdFrom);
        createdFrom.setHours(0, 0, 0, 0);

        qb.andWhere('"workspace"."created_at" >= :createdFrom', {
          createdFrom,
        });
      }

      if (filter.createdTo) {
        const createdTo = new Date(filter.createdTo);
        createdTo.setHours(23, 59, 59, 999);

        qb.andWhere('"workspace"."created_at" <= :createdTo', {
          createdTo,
        });
      }
    }

    return qb;
  }

  private async getWorkspaceCountMaps(
    workspaceIds: string[],
    manager?: EntityManager,
  ): Promise<WorkspaceCountMaps> {
    const empty: WorkspaceCountMaps = {
      members: new Map(),
      projects: new Map(),
      boards: new Map(),
      tasks: new Map(),
    };

    if (!workspaceIds.length) {
      return empty;
    }

    const queryManager = manager ?? this.repo.manager;
    const [members, projects, boards, tasks] = await Promise.all([
      queryManager.query<WorkspaceAggregateRaw[]>(
        `
          SELECT "workspace_id" AS "workspaceId", COUNT(*)::text AS "count"
          FROM "user_workspaces"
          WHERE "workspace_id" = ANY($1::uuid[])
          GROUP BY "workspace_id"
        `,
        [workspaceIds],
      ),
      queryManager.query<WorkspaceAggregateRaw[]>(
        `
          SELECT "workspace_id" AS "workspaceId", COUNT(*)::text AS "count"
          FROM "projects"
          WHERE "workspace_id" = ANY($1::uuid[])
          GROUP BY "workspace_id"
        `,
        [workspaceIds],
      ),
      queryManager.query<WorkspaceAggregateRaw[]>(
        `
          SELECT "workspace_id" AS "workspaceId", COUNT(*)::text AS "count"
          FROM "boards"
          WHERE "workspace_id" = ANY($1::uuid[])
          GROUP BY "workspace_id"
        `,
        [workspaceIds],
      ),
      queryManager.query<WorkspaceAggregateRaw[]>(
        `
          SELECT "workspace_id" AS "workspaceId", COUNT(*)::text AS "count"
          FROM "tasks"
          WHERE "workspace_id" = ANY($1::uuid[])
            AND "deleted_at" IS NULL
          GROUP BY "workspace_id"
        `,
        [workspaceIds],
      ),
    ]);

    return {
      members: this.toCountMap(members),
      projects: this.toCountMap(projects),
      boards: this.toCountMap(boards),
      tasks: this.toCountMap(tasks),
    };
  }

  private toCountMap(rows: WorkspaceAggregateRaw[]): Map<string, number> {
    return new Map(
      rows.map((row) => [row.workspaceId, Number(row.count ?? 0)]),
    );
  }
}
