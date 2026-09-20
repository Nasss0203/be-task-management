import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';
import { ActivityModel } from '../../../../domain/entities/activity.entity';
import {
  ActivityRepository,
  FindActivityFilters,
  FindActivityResult,
  SaveActivityInput,
} from '../../../../domain/repositories/activity.repository';
import { Activity } from '../entities/activity.orm-entity';
import { ActivityMapper } from '../mappers/activity.mapper';

@Injectable()
export class TypeOrmActivityRepository implements ActivityRepository {
  constructor(
    @InjectRepository(Activity)
    private readonly repo: Repository<Activity>,
  ) {}

  private getRepo(context?: PersistenceContext): Repository<Activity> {
    return context
      ? (context as EntityManager).getRepository(Activity)
      : this.repo;
  }

  async save(
    activity: SaveActivityInput,
    context?: PersistenceContext,
  ): Promise<ActivityModel> {
    const repo = this.getRepo(context);

    const entity = ActivityMapper.toEntity(activity);

    const saved = await repo.save(entity);

    return ActivityMapper.toModel(saved);
  }

  async findMany(filters: FindActivityFilters): Promise<FindActivityResult> {
    const limit = this.normalizeLimit(filters.limit);

    const qb = this.repo
      .createQueryBuilder('activity')
      .where('activity.workspaceId = :workspaceId', {
        workspaceId: filters.workspaceId,
      });

    if (filters.projectId) {
      qb.andWhere('activity.projectId = :projectId', {
        projectId: filters.projectId,
      });
    }

    if (filters.entityType) {
      qb.andWhere('activity.entityType = :entityType', {
        entityType: filters.entityType,
      });
    }

    if (filters.entityId) {
      qb.andWhere('activity.entityId = :entityId', {
        entityId: filters.entityId,
      });
    }

    if (filters.actorId) {
      qb.andWhere('activity.actorId = :actorId', {
        actorId: filters.actorId,
      });
    }

    if (filters.action) {
      qb.andWhere('activity.action = :action', {
        action: filters.action,
      });
    }

    if (filters.cursor) {
      qb.andWhere('activity.createdAt < :cursor', {
        cursor: new Date(filters.cursor),
      });
    }

    const rows = await qb
      .orderBy('activity.createdAt', 'DESC')
      .addOrderBy('activity.id', 'DESC')
      .take(limit + 1)
      .getMany();

    const hasNextPage = rows.length > limit;
    const items = rows
      .slice(0, limit)
      .map((row) => ActivityMapper.toModel(row));
    const nextCursor =
      hasNextPage && items.length
        ? items[items.length - 1].createdAt.toISOString()
        : null;

    return {
      items,
      nextCursor,
    };
  }

  private normalizeLimit(limit?: number): number {
    if (!limit || Number.isNaN(limit)) {
      return 20;
    }

    return Math.min(Math.max(limit, 1), 100);
  }
}
