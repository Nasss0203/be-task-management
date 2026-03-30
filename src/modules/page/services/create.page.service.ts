import { Inject, Injectable } from '@nestjs/common';
import { PageBlockType } from 'src/modules/page_block/domain/entities/page_block.entity';
import { type CreatePageBlockService } from 'src/modules/page_block/interfaces/services/create.page_block.service.interface';
import { PAGE_BLOCK_TYPES } from 'src/modules/page_block/interfaces/types';
import { EntityManager } from 'typeorm';
import { CreatePageDto } from '../dto/create-page.dto';
import { type PageRepository } from '../interfaces/repositories/page.repository.interface';
import { CreatePageService } from '../interfaces/services/create.page.service.interface';
import { PAGE_TYPES } from '../interfaces/types';

@Injectable()
export class CreatePageServiceImpl implements CreatePageService {
  constructor(
    @Inject(PAGE_TYPES.repositories.PageRepository)
    private readonly repo: PageRepository,

    @Inject(PAGE_BLOCK_TYPES.services.CreatePageBlockService)
    private readonly createPageBlockService: CreatePageBlockService,
  ) {}
  async create(
    CreateWorkspaceMultiServiceDto: CreatePageDto,
    manager: EntityManager,
  ): Promise<any> {
    const page = await this.repo.save(CreateWorkspaceMultiServiceDto, manager);

    const pageBlock = await this.createPageBlockService.create(
      {
        page_id: page.id,
        type: PageBlockType.BOARD,
        title: page.title,
        position_x: 0,
        position_y: 0,
        width: 12,
        height: 1,
        order_index: 0,
        style_config: null,
        data_config: null,
        created_by: page.created_by,
      },
      manager,
    );

    return {
      page,
      pageBlock,
    };
  }
}
