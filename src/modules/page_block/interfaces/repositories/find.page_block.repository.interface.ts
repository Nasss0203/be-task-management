import { EntityManager } from 'typeorm';
import { PageBlockModel } from '../../domain/models/page_block.model';

export interface FindPageBlockRepository {
  findAllById(
    blockId: string,
    manager?: EntityManager,
  ): Promise<PageBlockModel | null>;

  findAllByPageId(
    pageId: string,
    manager?: EntityManager,
  ): Promise<PageBlockModel | null>;
}
