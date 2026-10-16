import type { PersistenceContext } from 'src/shared/domain/persistence-context';
import type { TemplateMarketplaceRelease } from '../aggregates/template-marketplace-release/template-marketplace-release.aggregate';

export interface TemplateMarketplaceReleaseRepository {
  findById(
    id: string,
    context?: PersistenceContext,
  ): Promise<TemplateMarketplaceRelease | null>;
  findByTemplateAndVersion(
    templateId: string,
    versionId: string,
    context?: PersistenceContext,
  ): Promise<TemplateMarketplaceRelease | null>;
  existsByTemplateAndVersion(
    templateId: string,
    versionId: string,
    context?: PersistenceContext,
  ): Promise<boolean>;
  findByTemplateId(
    templateId: string,
    context?: PersistenceContext,
  ): Promise<TemplateMarketplaceRelease[]>;
  save(
    release: TemplateMarketplaceRelease,
    context?: PersistenceContext,
  ): Promise<TemplateMarketplaceRelease>;
  insertIfAbsent(
    release: TemplateMarketplaceRelease,
    context?: PersistenceContext,
  ): Promise<void>;
}
