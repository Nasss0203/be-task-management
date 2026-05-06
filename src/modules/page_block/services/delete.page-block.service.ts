import { Inject, Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { type DeletePageBlockRepository } from '../interfaces/repositories/delete.page-block.repository.interface';
import { DeletePageBlockService } from '../interfaces/services/delete.page-block.service.interface';
import { PAGE_BLOCK_TYPES } from '../interfaces/types';

@Injectable()
export class DeletePageBlockServiceImpl implements DeletePageBlockService {
  constructor(
    @Inject(PAGE_BLOCK_TYPES.repositories.DeletePageBlockRepository)
    private readonly deletePageBlockRepository: DeletePageBlockRepository,
  ) {}

  softDeletePageBlock(
    input: {
      blockId: string;
      deletedBy: string;
    },
    manager?: EntityManager,
  ): Promise<void> {
    return this.deletePageBlockRepository.softDeletePageBlock(input, manager);
  }

  restorePageBlock(
    input: {
      blockId: string;
    },
    manager?: EntityManager,
  ): Promise<void> {
    return this.deletePageBlockRepository.restorePageBlock(input, manager);
  }
}
