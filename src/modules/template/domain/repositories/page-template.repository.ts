import type { PersistenceContext } from 'src/shared/domain/persistence-context';
import type { TemplateListScope } from '../../presentation/http/requests/list-page-templates.request';
import { PageTemplate } from '../aggregates/page-template/page-template.aggregate';
import type { TemplateVersion } from '../aggregates/template-version/template-version.aggregate';

export type FindPageTemplatesFilters = {
  scope: TemplateListScope;
  userId?: string;
  workspaceId?: string;
  canManageWorkspace?: boolean;
  // Opt in for the anonymous catalog; dashboard filtering stays unchanged.
  requirePublishedVersion?: boolean;
  search?: string;
  categorySlug?: string;
  // Public catalog only: listing tag and FREE/PAID offer.
  tag?: string;
  offerType?: 'FREE' | 'PAID';
  cursor?: {
    createdAt: Date;
    id: string;
  };
  limit: number;
};

export type FindPageTemplatesResult = {
  items: PageTemplate[];
  versions: Map<string, TemplateVersion>;
  hasNextPage: boolean;
};

export type FindPublicPageTemplateByIdResult = {
  template: PageTemplate;
  version: TemplateVersion;
} | null;

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

  findPublicById(
    id: string,
    context?: PersistenceContext,
  ): Promise<FindPublicPageTemplateByIdResult>;
}
