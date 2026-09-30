import type { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';
import { PagePublication } from '../entities/page-publication.entity';

export interface PagePublicationRepository {
  findBySiteAndPath(
    siteId: string,
    path: string,
    context?: PersistenceContext,
  ): Promise<PagePublication | null>;
  findById(
    id: string,
    context?: PersistenceContext,
  ): Promise<PagePublication | null>;
  findByPageId(
    pageId: string,
    context?: PersistenceContext,
  ): Promise<PagePublication[]>;
  findBySiteAndPage(
    siteId: string,
    pageId: string,
    context?: PersistenceContext,
  ): Promise<PagePublication | null>;
  findActiveBySiteAndPath(
    siteId: string,
    path: string,
    context?: PersistenceContext,
  ): Promise<PagePublication | null>;
  findBySiteId(
    siteId: string,
    context?: PersistenceContext,
  ): Promise<PagePublication[]>;
  save(
    publication: PagePublication,
    context?: PersistenceContext,
  ): Promise<PagePublication>;
}
