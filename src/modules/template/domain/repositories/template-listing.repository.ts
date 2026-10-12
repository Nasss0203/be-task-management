import type { PersistenceContext } from 'src/shared/domain/persistence-context';
import type { TemplateListing } from '../aggregates/template-listing/template-listing.aggregate';

export interface TemplateListingRepository {
  replaceCategoryIds(
    listingId: string,
    categoryIds: string[],
    context: PersistenceContext,
  ): Promise<void>;

  create(
    listing: TemplateListing,
    context?: PersistenceContext,
  ): Promise<TemplateListing>;

  save(
    listing: TemplateListing,
    context?: PersistenceContext,
  ): Promise<TemplateListing>;

  findById(
    id: string,
    context?: PersistenceContext,
  ): Promise<TemplateListing | null>;

  findByTemplateId(
    templateId: string,
    context?: PersistenceContext,
  ): Promise<TemplateListing | null>;
}
