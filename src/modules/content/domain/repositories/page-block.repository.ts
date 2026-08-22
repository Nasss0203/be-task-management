import { PageBlock } from 'src/modules/content/domain/entities/page-block.entity';
import { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';

export interface PageBlockRepository {
  findById(id: string, context?: PersistenceContext): Promise<PageBlock | null>;
  findByPageId(pageId: string, context?: PersistenceContext): Promise<PageBlock[]>;
  findDeletedById(id: string, context?: PersistenceContext): Promise<PageBlock | null>;
  findDeletedByWorkspace(workspaceId: string, pageId?: string, context?: PersistenceContext): Promise<PageBlock[]>;
  save(pageBlock: PageBlock, context?: PersistenceContext): Promise<PageBlock>;
  saveMany(pageBlocks: PageBlock[], context?: PersistenceContext): Promise<PageBlock[]>;
  delete(id: string, context?: PersistenceContext): Promise<void>;
  shiftOrderIndexesForInsert(pageId: string, fromOrderIndex: number, context?: PersistenceContext): Promise<void>;
}
