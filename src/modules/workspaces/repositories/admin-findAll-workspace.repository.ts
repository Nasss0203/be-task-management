import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  AdminWorkspaceItemResponseDto,
  AdminWorkspaceStatus,
} from 'src/modules/admin/dto/response/dashboard/workspace-overview.response.dto';
import { EntityManager, Repository } from 'typeorm';
import { AdminWorkspaceStatus as AdminWorkspaceStatusFilter } from '../dto/search-workspace.dto';
import { Workspace } from '../domain/entities/workspace.entity';
import { AdminFindAllWorkspaceRepository } from '../interfaces/repositories/admin-findAll-workspace.repository.interface';
import { AdminFindAllWorkspaceFilter } from '../interfaces/workspace-filter.type';

type AdminWorkspaceRaw = {
  id: string;
  name: string;
  slug: string;
  plan: Workspace['planType'];
  status: AdminWorkspaceStatus;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  ownerName: string | null;
  ownerEmail: string | null;
  membersCount: string;
  projectsCount: string;
  boardsCount: string;
  tasksCount: string;
};

@Injectable()
export class AdminFindAllWorkspaceRepositoryImpl implements AdminFindAllWorkspaceRepository {
  constructor(
    @InjectRepository(Workspace)
    private readonly repo: Repository<Workspace>,
  ) {}

  private getRepo(manager?: EntityManager): Repository<Workspace> {
    return manager ? manager.getRepository(Workspace) : this.repo;
  }

  async findAllWorkspace(
    filter: AdminFindAllWorkspaceFilter,
    manager?: EntityManager,
  ): Promise<AdminWorkspaceItemResponseDto[]> {
    const qb = this.getRepo(manager)
      .createQueryBuilder('workspace')
      .withDeleted()
      .leftJoin('user_workspaces', 'uw', 'uw.workspace_id = workspace.id')
      .leftJoin('projects', 'project', 'project.workspace_id = workspace.id')
      .leftJoin('boards', 'board', 'board.workspace_id = workspace.id')
      .leftJoin(
        'tasks',
        'task',
        'task.workspace_id = workspace.id AND task.deleted_at IS NULL',
      )
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
      .select('workspace.id', 'id')
      .addSelect('workspace.name', 'name')
      .addSelect('workspace.slug', 'slug')
      .addSelect('workspace.planType', 'plan')
      .addSelect('workspace.createdAt', 'createdAt')
      .addSelect('workspace.updatedAt', 'updatedAt')
      .addSelect('workspace.deletedAt', 'deletedAt')
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
      .addSelect('COUNT(DISTINCT uw.user_id)', 'membersCount')
      .addSelect('COUNT(DISTINCT project.id)', 'projectsCount')
      .addSelect('COUNT(DISTINCT board.id)', 'boardsCount')
      .addSelect('COUNT(DISTINCT task.id)', 'tasksCount')
      .groupBy('workspace.id')
      .orderBy('workspace.createdAt', 'DESC');

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

    if (filter.plan) {
      qb.andWhere('"workspace"."plan_type" = :plan', {
        plan: filter.plan,
      });
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

    const rows = await qb.getRawMany<AdminWorkspaceRaw>();

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      plan: row.plan,
      status: row.status,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      deletedAt: row.deletedAt,
      ownerName: row.ownerName,
      ownerEmail: row.ownerEmail,
      membersCount: Number(row.membersCount ?? 0),
      projectsCount: Number(row.projectsCount ?? 0),
      boardsCount: Number(row.boardsCount ?? 0),
      tasksCount: Number(row.tasksCount ?? 0),
    }));
  }
}
