import { Page } from 'src/modules/content/domain/aggregates/page/page.aggregate';
import { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';

/** Only what is needed to find a Page by its name. */
export interface PageTitle {
  id: string;
  title: string;
}

export interface PageRepository {
  lockWorkspaceHierarchy(
    workspaceId: string,
    context: PersistenceContext,
  ): Promise<void>;
  lockGlobalSubdomainAllocation(context: PersistenceContext): Promise<void>;
  existsByPublicSubdomain(
    subdomain: string,
    context: PersistenceContext,
  ): Promise<boolean>;
  findById(id: string, context?: PersistenceContext): Promise<Page | null>;
  findByWorkspace(
    workspaceId: string,
    userId: string,
    context?: PersistenceContext,
  ): Promise<Page[]>;
  findDeletedByWorkspace(
    workspaceId: string,
    context?: PersistenceContext,
  ): Promise<Page[]>;
  save(page: Page, context?: PersistenceContext): Promise<Page>;
  /** Marks the Page edited now, e.g. after its content (blocks) changed. */
  touch(id: string, context?: PersistenceContext): Promise<void>;
  delete(id: string, context?: PersistenceContext): Promise<void>;
  deletePermanently(id: string, context?: PersistenceContext): Promise<void>;
  softDeleteHierarchy(
    pageId: string,
    deletedBy: string,
    context?: PersistenceContext,
  ): Promise<void>;
  existsBySlug(
    workspaceId: string,
    slug: string,
    context?: PersistenceContext,
  ): Promise<boolean>;
  findDeletedById(
    id: string,
    context?: PersistenceContext,
  ): Promise<Page | null>;

  findAccessibleByWorkspace(
    workspaceId: string,
    userId: string,
    context?: PersistenceContext,
  ): Promise<Page[]>;
  /** Accessible live Pages whose title equals this one (NFC, any case). */
  findAccessibleByExactTitle(
    workspaceId: string,
    userId: string,
    title: string,
    context?: PersistenceContext,
  ): Promise<Page[]>;
  /** Id and title of every accessible live Page, without loading the Pages. */
  findAccessibleTitlesByWorkspace(
    workspaceId: string,
    userId: string,
    context?: PersistenceContext,
  ): Promise<PageTitle[]>;
  findAccessibleDeletedByWorkspace(
    workspaceId: string,
    userId: string,
    context?: PersistenceContext,
  ): Promise<Page[]>;
  restoreHierarchy(pageId: string, context?: PersistenceContext): Promise<void>;

  moveHierarchy(
    pageId: string,
    parentPageId: string | null,
    teamspaceId: string | null,
    context?: PersistenceContext,
    publicSubdomain?: string | null,
  ): Promise<void>;

  findDescendants(
    pageId: string,
    context?: PersistenceContext,
  ): Promise<Page[]>;
}
