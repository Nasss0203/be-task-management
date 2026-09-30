import type { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';
import { PublishedSite } from '../entities/published-site.entity';

export interface PublishedSiteRepository {
  findByIdForUpdate(
    id: string,
    context: PersistenceContext,
  ): Promise<PublishedSite | null>;
  findById(
    id: string,
    context?: PersistenceContext,
  ): Promise<PublishedSite | null>;
  findBySubdomain(
    subdomain: string,
    context?: PersistenceContext,
  ): Promise<PublishedSite | null>;
  findActiveBySubdomain(
    subdomain: string,
    context?: PersistenceContext,
  ): Promise<PublishedSite | null>;
  findByWorkspaceId(
    workspaceId: string,
    context?: PersistenceContext,
  ): Promise<PublishedSite[]>;
  existsBySubdomain(
    subdomain: string,
    context?: PersistenceContext,
  ): Promise<boolean>;
  save(
    site: PublishedSite,
    context?: PersistenceContext,
  ): Promise<PublishedSite>;
  findByRootPageId(
    rootPageId: string,
    context?: PersistenceContext,
  ): Promise<PublishedSite | null>;
}
