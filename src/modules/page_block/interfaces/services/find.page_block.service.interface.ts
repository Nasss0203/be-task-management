import { EntityManager } from 'typeorm';
import { PageBlockModel } from '../../domain/models/page_block.model';
import { PageBlockRestoreLookup } from '../repositories/find.page_block.repository.interface';

export interface FindPageBlockService {
  findAllById(
    pageId: string,
    manager?: EntityManager,
  ): Promise<PageBlockModel | null>;

  findAllByPageId(
    pageId: string,
    manager?: EntityManager,
  ): Promise<PageBlockModel[]>;

  getNextOrderIndex(pageId: string, manager?: EntityManager): Promise<number>;

  findDeletedPageBlocks(
    workspaceId: string,
    pageId?: string,
  ): Promise<PageBlockModel[]>;

  findOnePageBlockForRestore(
    workspaceId: string,
    blockId: string,
  ): Promise<PageBlockRestoreLookup | null>;
}
