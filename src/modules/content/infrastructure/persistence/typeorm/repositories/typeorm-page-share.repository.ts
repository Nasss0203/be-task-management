import { Injectable } from '@nestjs/common';

import { DataSource, EntityManager, Repository } from 'typeorm';

import type { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';

import type { PageShareRepository } from '../../../../domain/repositories/page-share.repository';

import type { PageShare } from '../../../../domain/entities/page-share.entity';

import { PageShareOrmEntity } from '../entities/page-share.orm-entity';
import { PageShareMapper } from '../mappers/page-share.mapper';

@Injectable()
export class TypeOrmPageShareRepository implements PageShareRepository {
  constructor(private readonly dataSource: DataSource) {}

  private resolveRepository(
    context?: PersistenceContext,
  ): Repository<PageShareOrmEntity> {
    if (context) {
      const manager = context as EntityManager;

      return manager.getRepository(PageShareOrmEntity);
    }

    return this.dataSource.getRepository(PageShareOrmEntity);
  }

  async save(
    pageShare: PageShare,
    context?: PersistenceContext,
  ): Promise<PageShare> {
    const repository = this.resolveRepository(context);

    const orm = PageShareMapper.toOrm(pageShare);

    const saved = await repository.save(orm);

    return PageShareMapper.toDomain(saved);
  }

  async findById(
    id: string,
    context?: PersistenceContext,
  ): Promise<PageShare | null> {
    const repository = this.resolveRepository(context);

    const orm = await repository.findOne({
      where: {
        id,
      },
    });

    return orm ? PageShareMapper.toDomain(orm) : null;
  }

  async findByPageAndUser(
    pageId: string,
    userId: string,
    context?: PersistenceContext,
  ): Promise<PageShare | null> {
    const repository = this.resolveRepository(context);

    const orm = await repository.findOne({
      where: {
        page_id: pageId,
        user_id: userId,
      },
    });

    return orm ? PageShareMapper.toDomain(orm) : null;
  }

  async findByPageId(
    pageId: string,
    context?: PersistenceContext,
  ): Promise<PageShare[]> {
    const repository = this.resolveRepository(context);

    const rows = await repository.find({
      where: {
        page_id: pageId,
      },
      order: {
        created_at: 'ASC',
      },
    });

    return rows.map(PageShareMapper.toDomain);
  }

  async findByUserId(
    userId: string,
    context?: PersistenceContext,
  ): Promise<PageShare[]> {
    const repository = this.resolveRepository(context);

    const entities = await repository.find({
      where: {
        user_id: userId,
      },

      order: {
        created_at: 'DESC',
      },
    });

    return entities.map(PageShareMapper.toDomain);
  }

  async deleteByPageAndUser(
    pageId: string,
    userId: string,
    context?: PersistenceContext,
  ): Promise<void> {
    const repository = this.resolveRepository(context);

    await repository.delete({
      page_id: pageId,
      user_id: userId,
    });
  }

  async exists(
    pageId: string,
    userId: string,
    context?: PersistenceContext,
  ): Promise<boolean> {
    const repository = this.resolveRepository(context);

    return repository.exists({
      where: {
        page_id: pageId,
        user_id: userId,
      },
    });
  }
}
