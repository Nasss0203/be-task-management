import type { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';

import type { PageFavorite } from '../entities/page-favorite.entity';

export interface PageFavoriteRepository {
  save(
    favorite: PageFavorite,
    context?: PersistenceContext,
  ): Promise<PageFavorite>;

  findByUserAndPage(
    userId: string,
    pageId: string,
    context?: PersistenceContext,
  ): Promise<PageFavorite | null>;

  findByUserId(
    userId: string,
    context?: PersistenceContext,
  ): Promise<PageFavorite[]>;

  deleteByUserAndPage(
    userId: string,
    pageId: string,
    context?: PersistenceContext,
  ): Promise<void>;

  exists(
    userId: string,
    pageId: string,
    context?: PersistenceContext,
  ): Promise<boolean>;
}
