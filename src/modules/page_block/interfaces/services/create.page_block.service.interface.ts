import { EntityManager } from 'typeorm';
import { PageBlockModel } from '../../domain/models/page_block.model';
import { CreatePageBlockDto } from '../../dto/create-page_block.dto';

export interface CreatePageBlockService {
  create(
    createPageBlockDto: CreatePageBlockDto,
    manager: EntityManager,
  ): Promise<PageBlockModel>;
}
