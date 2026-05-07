import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Workspace } from '../domain/entities/workspace.entity';
import { WorkspaceModel } from '../domain/models/workspaces.model';
import { AdminFindAllWorkspaceRepository } from '../interfaces/repositories/admin-findAll-workspace.repository.interface';
import { AdminFindAllWorkspaceFilter } from '../interfaces/workspace-filter.type';
import { WorkspaceMapper } from '../mapper/workspace.mapper';

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
  ): Promise<WorkspaceModel[]> {
    const qb = this.getRepo(manager)
      .createQueryBuilder('workspace')
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

    const workspaces = await qb.getMany();

    return workspaces.map(
      (workspace): WorkspaceModel => WorkspaceMapper.toModel(workspace),
    );
  }
}
