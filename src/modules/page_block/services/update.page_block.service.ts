import { Inject, Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { PageBlockModel } from '../domain/models/page_block.model';
import { UpdatePageBlockDto } from '../dto/update-page_block.dto';
import { type UpdatePageBlockRepository } from '../interfaces/repositories/update.page_block.repository.interface';
import { UpdatePageBlockService } from '../interfaces/services/update.page_block.service.interface';
import { PAGE_BLOCK_TYPES } from '../interfaces/types';

@Injectable()
export class UpdatePageBlockServiceImpl implements UpdatePageBlockService {
  constructor(
    @Inject(PAGE_BLOCK_TYPES.repositories.UpdatePageBlockRepository)
    private readonly repo: UpdatePageBlockRepository,
  ) {}

  update(
    updatePageBlockDto: UpdatePageBlockDto,
    manager: EntityManager,
  ): Promise<PageBlockModel> {
    return this.repo.save(updatePageBlockDto, manager);
  }
}
