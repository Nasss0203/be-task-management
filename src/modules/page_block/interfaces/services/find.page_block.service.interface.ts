import { EntityManager } from 'typeorm';
import { PageBlockModel } from '../../domain/models/page_block.model';

export interface FindPageBlockService {
  findAllById(
    pageId: string,
    manager?: EntityManager,
  ): Promise<PageBlockModel | null>;

  findAllByPageId(
    pageId: string,
    manager?: EntityManager,
  ): Promise<PageBlockModel | null>;

  getNextOrderIndex(pageId: string, manager?: EntityManager): Promise<number>;
}
