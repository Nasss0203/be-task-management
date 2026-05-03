import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AdminWorkspaceItemResponseDto } from 'src/modules/admin/dto/response/workspace-overview.response.dto';
import { EntityManager, Repository } from 'typeorm';
import { Workspace } from '../domain/entities/workspace.entity';
import { AdminFindAllWorkspaceRepository } from '../interfaces/repositories/admin-findAll-workspace.repository.interface';
import { AdminFindAllWorkspaceFilter } from '../interfaces/workspace-filter.type';

type AdminWorkspaceRaw = {
  id: string;
  name: string;
  slug: string;
  plan: Workspace['planType'];
  createdAt: Date;
  updatedAt: Date;
  owner: string | null;
  membersCount: string;
  projectsCount: string;
  tasksCount: string;
  userCount: string;
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
      .leftJoin('user_workspaces', 'uw', 'uw.workspace_id = workspace.id')
      .leftJoin('projects', 'project', 'project.workspace_id = workspace.id')
      .leftJoin('tasks', 'task', 'task.workspace_id = workspace.id')
      .leftJoin('user_roles', 'ur', 'ur.workspace_id = workspace.id')
      .leftJoin('roles', 'role', 'role.id = ur.role_id')
      .leftJoin(
        'users',
        'ownerUser',
        'ownerUser.id = ur.user_id AND role.name = :ownerRole',
        { ownerRole: 'OWNER' },
      )
      .select('workspace.id', 'id')
      .addSelect('workspace.name', 'name')
      .addSelect('workspace.slug', 'slug')
      .addSelect('workspace.planType', 'plan')
      .addSelect('workspace.createdAt', 'createdAt')
      .addSelect('workspace.updatedAt', 'updatedAt')
      .addSelect('MAX(ownerUser.email)', 'owner')
      .addSelect('COUNT(DISTINCT uw.user_id)', 'membersCount')
      .addSelect('COUNT(DISTINCT project.id)', 'projectsCount')
      .addSelect('COUNT(DISTINCT task.id)', 'tasksCount')
      .addSelect('COUNT(DISTINCT uw.user_id)', 'userCount')
      .groupBy('workspace.id')
      .orderBy('workspace.createdAt', 'DESC');

    if (filter.search?.trim()) {
      qb.andWhere(
        '(workspace.name ILIKE :search OR workspace.slug ILIKE :search)',
        {
          search: `%${filter.search.trim()}%`,
        },
      );
    }

    if (filter.plan) {
      qb.andWhere('workspace.planType = :plan', {
        plan: filter.plan,
      });
    }

    if (filter.createdAt) {
      const startOfDay = new Date(filter.createdAt);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(filter.createdAt);
      endOfDay.setHours(23, 59, 59, 999);

      qb.andWhere('workspace.createdAt BETWEEN :startOfDay AND :endOfDay', {
        startOfDay,
        endOfDay,
      });
    } else {
      if (filter.createdFrom) {
        const createdFrom = new Date(filter.createdFrom);
        createdFrom.setHours(0, 0, 0, 0);

        qb.andWhere('workspace.createdAt >= :createdFrom', {
          createdFrom,
        });
      }

      if (filter.createdTo) {
        const createdTo = new Date(filter.createdTo);
        createdTo.setHours(23, 59, 59, 999);

        qb.andWhere('workspace.createdAt <= :createdTo', {
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
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      owner: row.owner ?? undefined,
      membersCount: Number(row.membersCount ?? 0),
      projectsCount: Number(row.projectsCount ?? 0),
      tasksCount: Number(row.tasksCount ?? 0),
      userCount: Number(row.userCount ?? 0),
    }));
  }
}
