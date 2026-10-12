import type { PersistenceContext } from 'src/shared/domain/persistence-context';
import type { TemplateCategory } from '../aggregates/template-category/template-category.aggregate';

export interface TemplateCategoryRepository {
  create(
    category: TemplateCategory,
    context?: PersistenceContext,
  ): Promise<TemplateCategory>;

  save(
    category: TemplateCategory,
    context?: PersistenceContext,
  ): Promise<TemplateCategory>;

  findById(
    id: string,
    context?: PersistenceContext,
  ): Promise<TemplateCategory | null>;

  findBySlug(
    slug: string,
    context?: PersistenceContext,
  ): Promise<TemplateCategory | null>;

  existsBySlug(
    slug: string,
    excludeId?: string,
    context?: PersistenceContext,
  ): Promise<boolean>;

  findAll(context?: PersistenceContext): Promise<TemplateCategory[]>;

  findAllActive(context?: PersistenceContext): Promise<TemplateCategory[]>;
  findByIdsForShare(
    ids: string[],
    context: PersistenceContext,
  ): Promise<TemplateCategory[]>;
}
