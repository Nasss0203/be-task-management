import { Injectable } from '@nestjs/common';

import { DataSource, EntityManager, Repository } from 'typeorm';

import type { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';

import { PageEditRequestStatus } from '../../../../domain/constants/page-edit-request-status.constant';

import type { PageEditRequest } from '../../../../domain/entities/page-edit-request.entity';

import type { PageEditRequestRepository } from '../../../../domain/repositories/page-edit-request.repository';

import { PageEditRequestOrmEntity } from '../entities/page-edit-request.orm-entity';

import { PageEditRequestMapper } from '../mappers/page-edit-request.mapper';

@Injectable()
export class TypeOrmPageEditRequestRepository implements PageEditRequestRepository {
  constructor(private readonly dataSource: DataSource) {}

  private resolveRepository(
    context?: PersistenceContext,
  ): Repository<PageEditRequestOrmEntity> {
    if (context) {
      const manager = context as EntityManager;

      return manager.getRepository(PageEditRequestOrmEntity);
    }

    return this.dataSource.getRepository(PageEditRequestOrmEntity);
  }

  async save(
    request: PageEditRequest,
    context?: PersistenceContext,
  ): Promise<PageEditRequest> {
    const repository = this.resolveRepository(context);

    const orm = PageEditRequestMapper.toOrm(request);

    const saved = await repository.save(orm);

    return PageEditRequestMapper.toDomain(saved);
  }

  async findById(
    id: string,
    context?: PersistenceContext,
  ): Promise<PageEditRequest | null> {
    const repository = this.resolveRepository(context);

    const orm = await repository.findOne({
      where: {
        id,
      },
    });

    return orm ? PageEditRequestMapper.toDomain(orm) : null;
  }

  async findPendingByPageShareId(
    pageShareId: string,
    context?: PersistenceContext,
  ): Promise<PageEditRequest | null> {
    const repository = this.resolveRepository(context);

    const orm = await repository.findOne({
      where: {
        page_share_id: pageShareId,

        status: PageEditRequestStatus.PENDING,
      },

      order: {
        created_at: 'DESC',
      },
    });

    return orm ? PageEditRequestMapper.toDomain(orm) : null;
  }

  async findByPageId(
    pageId: string,
    context?: PersistenceContext,
  ): Promise<PageEditRequest[]> {
    const repository = this.resolveRepository(context);

    const rows = await repository.find({
      where: {
        page_id: pageId,
      },

      order: {
        created_at: 'DESC',
      },
    });

    return rows.map((row) => PageEditRequestMapper.toDomain(row));
  }

  async findByUserId(
    userId: string,
    context?: PersistenceContext,
  ): Promise<PageEditRequest[]> {
    const repository = this.resolveRepository(context);

    const rows = await repository.find({
      where: {
        user_id: userId,
      },

      order: {
        created_at: 'DESC',
      },
    });

    return rows.map((row) => PageEditRequestMapper.toDomain(row));
  }
}
