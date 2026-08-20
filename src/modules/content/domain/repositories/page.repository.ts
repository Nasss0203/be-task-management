import { Page } from 'src/modules/content/domain/aggregates/page/page.aggregate';
import { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';

export interface PageRepository {
  findById(id: string, context?: PersistenceContext): Promise<Page | null>;
  findByWorkspace(workspaceId: string, context?: PersistenceContext): Promise<Page[]>;
  findDeletedByWorkspace(workspaceId: string, context?: PersistenceContext): Promise<Page[]>;
  save(page: Page, context?: PersistenceContext): Promise<Page>;
  delete(id: string, context?: PersistenceContext): Promise<void>;
  existsBySlug(workspaceId: string, slug: string, context?: PersistenceContext): Promise<boolean>;
}
