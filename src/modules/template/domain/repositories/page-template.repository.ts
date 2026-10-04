import type { PersistenceContext } from 'src/shared/domain/persistence-context';
import { PageTemplate } from '../aggregates/page-template/page-template.aggregate';
import type { TemplateListScope } from '../../presentation/http/requests/list-page-templates.request';

export type FindPageTemplatesFilters = {
  scope: TemplateListScope;
  userId: string;
  workspaceId?: string;
  canManageWorkspace?: boolean;
  search?: string;
  cursor?: {
    createdAt: Date;
    id: string;
  };
  limit: number;
};

export type FindPageTemplatesResult = {
  items: PageTemplate[];
  hasNextPage: boolean;
};

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

  findMany(
    filters: FindPageTemplatesFilters,
    context?: PersistenceContext,
  ): Promise<FindPageTemplatesResult>;
}
