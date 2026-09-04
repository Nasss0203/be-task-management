import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager, Repository } from 'typeorm';

import type { PageFavorite } from 'src/modules/content/domain/entities/page-favorite.entity';
import type { PageFavoriteRepository } from 'src/modules/content/domain/repositories/page-favorite.repository';

import type { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';

import { PageFavoriteOrmEntity } from '../entities/page-favorite.orm-entity';
import { PageFavoriteMapper } from '../mappers/page-favorite.mapper';

@Injectable()
export class TypeOrmPageFavoriteRepository implements PageFavoriteRepository {
  constructor(private readonly dataSource: DataSource) {}

  private resolveRepo(
    context?: PersistenceContext,
  ): Repository<PageFavoriteOrmEntity> {
    if (context) {
      const manager = context as EntityManager;

      return manager.getRepository(PageFavoriteOrmEntity);
    }

    return this.dataSource.getRepository(PageFavoriteOrmEntity);
  }

  async save(
    favorite: PageFavorite,
    context?: PersistenceContext,
  ): Promise<PageFavorite> {
    const repo = this.resolveRepo(context);

    const saved = await repo.save(PageFavoriteMapper.toOrm(favorite));

    return PageFavoriteMapper.toDomain(saved);
  }

  async findByUserAndPage(
    userId: string,
    pageId: string,
    context?: PersistenceContext,
  ): Promise<PageFavorite | null> {
    const repo = this.resolveRepo(context);

    const entity = await repo.findOne({
      where: {
        user_id: userId,
        page_id: pageId,
      },
    });

    return entity ? PageFavoriteMapper.toDomain(entity) : null;
  }

  async findByUserId(
    userId: string,
    context?: PersistenceContext,
  ): Promise<PageFavorite[]> {
    const repo = this.resolveRepo(context);

    const entities = await repo.find({
      where: {
        user_id: userId,
      },
      order: {
        created_at: 'DESC',
      },
    });

    return entities.map(PageFavoriteMapper.toDomain);
  }

  async deleteByUserAndPage(
    userId: string,
    pageId: string,
    context?: PersistenceContext,
  ): Promise<void> {
    const repo = this.resolveRepo(context);

    await repo.delete({
      user_id: userId,
      page_id: pageId,
    });
  }

  async exists(
    userId: string,
    pageId: string,
    context?: PersistenceContext,
  ): Promise<boolean> {
    const repo = this.resolveRepo(context);

    return repo.exists({
      where: {
        user_id: userId,
        page_id: pageId,
      },
    });
  }
}
