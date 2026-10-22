import { PageBlock } from 'src/modules/content/domain/entities/page-block.entity';
import { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';

export interface PageBlockRepository {
  findById(id: string, context?: PersistenceContext): Promise<PageBlock | null>;
  findByPageId(
    pageId: string,
    context?: PersistenceContext,
  ): Promise<PageBlock[]>;
  countByPageId(pageId: string, context?: PersistenceContext): Promise<number>;
  findActiveSiblings(
    pageId: string,
    parentBlockId: string | null,
    context?: PersistenceContext,
  ): Promise<PageBlock[]>;
  findLastSibling(
    pageId: string,
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
    parentBlockId: string | null,
    fromOrderIndex: number,
    context?: PersistenceContext,
  ): Promise<void>;
}
