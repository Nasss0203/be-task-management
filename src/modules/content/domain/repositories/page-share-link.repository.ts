import type { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';

import type { PageShareLink } from '../entities/page-share-link.entity';

export interface PageShareLinkRepository {
  save(
    shareLink: PageShareLink,
    context?: PersistenceContext,
  ): Promise<PageShareLink>;

  findById(
    id: string,
    context?: PersistenceContext,
  ): Promise<PageShareLink | null>;

  findByTokenHash(
    tokenHash: string,
    context?: PersistenceContext,
  ): Promise<PageShareLink | null>;

  findActiveByPageId(
    pageId: string,
    context?: PersistenceContext,
  ): Promise<PageShareLink | null>;
}
