import type { PersistenceContext } from 'src/shared/domain/persistence-context';
import { PageTemplate } from '../aggregates/page-template/page-template.aggregate';

export interface PageTemplateRepository {
  create(
    template: PageTemplate,
    context?: PersistenceContext,
  ): Promise<PageTemplate>;

  save(
    template: PageTemplate,
    context?: PersistenceContext,
  ): Promise<PageTemplate>;

  findById(
    id: string,
    context?: PersistenceContext,
  ): Promise<PageTemplate | null>;

  findByIdForUpdate(
    id: string,
    context?: PersistenceContext,
  ): Promise<PageTemplate | null>;

  findByWorkspaceId(
    workspaceId: string,
    context?: PersistenceContext,
  ): Promise<PageTemplate[]>;

  findByCreatorId(
    createdBy: string,
    context?: PersistenceContext,
  ): Promise<PageTemplate[]>;
}
