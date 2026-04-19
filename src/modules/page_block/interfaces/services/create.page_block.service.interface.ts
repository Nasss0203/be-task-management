import { EntityManager } from 'typeorm';
import { PageBlockModel } from '../../domain/models/page_block.model';
import {
  AddDatabaseViewToBlockDto,
  CreatePageBlockDto,
} from '../../dto/create-page_block.dto';

export interface CreatePageBlockService {
  create(
    createPageBlockDto: CreatePageBlockDto,
    manager: EntityManager,
  ): Promise<PageBlockModel>;

  addDatabaseViewToBlock(
    blockId: string,
    // pageId: string,
    newView: AddDatabaseViewToBlockDto,
    manager: EntityManager,
  ): Promise<PageBlockModel>;
}
