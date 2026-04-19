import { Inject, Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { PageBlockModel } from '../domain/models/page_block.model';
import { type FindPageBlockRepository } from '../interfaces/repositories/find.page_block.repository.interface';
import { FindPageBlockService } from '../interfaces/services/find.page_block.service.interface';
import { PAGE_BLOCK_TYPES } from '../interfaces/types';

@Injectable()
export class FindPageBlockServiceImpl implements FindPageBlockService {
  constructor(
    @Inject(PAGE_BLOCK_TYPES.repositories.FindPageBlockRepository)
    private readonly findPageBlockRepository: FindPageBlockRepository,
  ) {}

  async findAllById(
    blockId: string,
    manager?: EntityManager,
  ): Promise<PageBlockModel | null> {
    return await this.findPageBlockRepository.findAllById(blockId, manager);
  }
  async findAllByPageId(
    pageId: string,
    manager?: EntityManager,
  ): Promise<PageBlockModel | null> {
    return await this.findPageBlockRepository.findAllByPageId(pageId, manager);
  }
}
