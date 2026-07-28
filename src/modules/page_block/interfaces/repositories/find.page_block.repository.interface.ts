import { EntityManager } from 'typeorm';
import { PageBlockModel } from '../../domain/models/page_block.model';

export type PageBlockRestoreLookup = {
  id: string;
  pageId: string;
  deletedAt: Date | null;
  pageDeletedAt: Date | null;
  workspaceDeletedAt: Date | null;
};

export interface FindPageBlockRepository {
  findAllById(
    blockId: string,
    manager?: EntityManager,
  ): Promise<PageBlockModel | null>;

  findActiveDatabaseViewBlocksByBoardId(
    boardId: string,
    manager?: EntityManager,
  ): Promise<PageBlockModel[]>;

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
