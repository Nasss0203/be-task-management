import { PageBlock } from 'src/modules/content/domain/entities/page-block.entity';
import { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';

export interface PageBlockRepository {
  findById(id: string, context?: PersistenceContext): Promise<PageBlock | null>;
  /** The page's own content: blocks inside tasks (`row_id`) are left out. */
  findByPageId(
    pageId: string,
    context?: PersistenceContext,
  ): Promise<PageBlock[]>;
  /** Content of one task (database row). */
  findByRowId(
    rowId: string,
    context?: PersistenceContext,
  ): Promise<PageBlock[]>;
  /** Counts the page's own content, like `findByPageId`. */
  countByPageId(pageId: string, context?: PersistenceContext): Promise<number>;
  /** Siblings share page, task (`rowId`, null for page content) and parent. */
  findActiveSiblings(
    pageId: string,
    rowId: string | null,
    parentBlockId: string | null,
    context?: PersistenceContext,
  ): Promise<PageBlock[]>;
  findLastSibling(
    pageId: string,
    rowId: string | null,
    parentBlockId: string | null,
    context?: PersistenceContext,
  ): Promise<PageBlock | null>;
  findActiveChildren(
    parentBlockId: string,
    context?: PersistenceContext,
  ): Promise<PageBlock[]>;
  findDeletedById(
    id: string,
    context?: PersistenceContext,
  ): Promise<PageBlock | null>;
  findDeletedByWorkspace(
    workspaceId: string,
    pageId?: string,
    context?: PersistenceContext,
  ): Promise<PageBlock[]>;
  /** Includes soft-deleted blocks. */
  findDatabaseViewBlocksByPageIds(
    pageIds: string[],
    context?: PersistenceContext,
  ): Promise<PageBlock[]>;
  deletePermanently(ids: string[], context?: PersistenceContext): Promise<void>;
  save(pageBlock: PageBlock, context?: PersistenceContext): Promise<PageBlock>;
  saveMany(
    pageBlocks: PageBlock[],
    context?: PersistenceContext,
  ): Promise<PageBlock[]>;
  shiftSiblingOrderIndexes(
    pageId: string,
    rowId: string | null,
    parentBlockId: string | null,
    fromOrderIndex: number,
    context?: PersistenceContext,
  ): Promise<void>;
}
