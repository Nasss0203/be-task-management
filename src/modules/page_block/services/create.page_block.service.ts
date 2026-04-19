import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { PageBlockType } from '../domain/entities/page_block.entity';
import { PageBlockModel } from '../domain/models/page_block.model';
import {
  AddDatabaseViewToBlockDto,
  CreatePageBlockDto,
} from '../dto/create-page_block.dto';
import { type CreatePageBlockRepository } from '../interfaces/repositories/create.page_block.repository.interface';

import { type FindPageBlockRepository } from '../interfaces/repositories/find.page_block.repository.interface';
import { type UpdatePageBlockRepository } from '../interfaces/repositories/update.page_block.repository.interface';
import { CreatePageBlockService } from '../interfaces/services/create.page_block.service.interface';
import { PAGE_BLOCK_TYPES } from '../interfaces/types';

@Injectable()
export class CreatePageBlockServiceImpl implements CreatePageBlockService {
  constructor(
    @Inject(PAGE_BLOCK_TYPES.repositories.CreatePageBlockRepository)
    private readonly repo: CreatePageBlockRepository,

    @Inject(PAGE_BLOCK_TYPES.repositories.FindPageBlockRepository)
    private readonly findPageBlockRepository: FindPageBlockRepository,

    @Inject(PAGE_BLOCK_TYPES.repositories.UpdatePageBlockRepository)
    private readonly updatePageBlockRepository: UpdatePageBlockRepository,
  ) {}

  create(
    createPageBlockDto: CreatePageBlockDto,
    manager: EntityManager,
  ): Promise<PageBlockModel> {
    // Check validator type

    const create = this.repo.save(createPageBlockDto, manager);
    return create;
  }

  async addDatabaseViewToBlock(
    blockId: string,
    // pageId: string,
    newView: AddDatabaseViewToBlockDto,
    manager: EntityManager,
  ): Promise<PageBlockModel> {
    const findPageBlock = await this.findPageBlockRepository.findAllById(
      blockId,
      manager,
    );
    if (!findPageBlock) {
      throw new NotFoundException('Page block not found');
    }

    if (findPageBlock.type !== PageBlockType.DATABASE_VIEW) {
      throw new BadRequestException('Block is not DATABASE_VIEW');
    }

    const current = Array.isArray(findPageBlock.data_config)
      ? findPageBlock.data_config
      : [];

    const exists = current.some(
      (item: any) => item.board_id === newView.board_id,
    );

    if (exists) {
      throw new BadRequestException('Board already exists in this block');
    }

    const next = [...current, newView];

    return this.updatePageBlockRepository.save(
      {
        id: blockId,
        data_config: next,
      },
      manager,
    );
  }
}
