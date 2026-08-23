import { PageBlock } from 'src/modules/content/domain/entities/page-block.entity';
import { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';

export interface PageBlockRepository {
  findById(id: string, context?: PersistenceContext): Promise<PageBlock | null>;
  findByPageId(
    pageId: string,
    context?: PersistenceContext,
  ): Promise<PageBlock[]>;
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
  save(pageBlock: PageBlock, context?: PersistenceContext): Promise<PageBlock>;
  saveMany(
    pageBlocks: PageBlock[],
    context?: PersistenceContext,
  ): Promise<PageBlock[]>;
}
