import type { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';

import type { PageShare } from '../entities/page-share.entity';

export interface PageShareRepository {
  save(pageShare: PageShare, context?: PersistenceContext): Promise<PageShare>;

  findById(id: string, context?: PersistenceContext): Promise<PageShare | null>;

  findByPageAndUser(
    pageId: string,
    userId: string,
    context?: PersistenceContext,
  ): Promise<PageShare | null>;

  findByPageId(
    pageId: string,
    context?: PersistenceContext,
  ): Promise<PageShare[]>;

  deleteByPageAndUser(
    pageId: string,
    userId: string,
    context?: PersistenceContext,
  ): Promise<void>;

  exists(
    pageId: string,
    userId: string,
    context?: PersistenceContext,
  ): Promise<boolean>;
}
