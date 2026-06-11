import { Inject, Injectable } from '@nestjs/common';
import { PageTemplateBlock } from '../domain/entities/page_template_block.entity';
import type { PageTemplateBlocksRepository } from '../interfaces/repositories/page_template_blocks.repository.interface';
import type { PageTemplateBlocksService } from '../interfaces/services/page_template_blocks.service.interface';
import { PAGE_TEMPLATE_BLOCK_TYPES } from '../interfaces/types';

@Injectable()
export class PageTemplateBlocksServiceImpl implements PageTemplateBlocksService {
  constructor(
    @Inject(PAGE_TEMPLATE_BLOCK_TYPES.repositories.PageTemplateBlocksRepository)
    private readonly repo: PageTemplateBlocksRepository,
  ) {}

  async findByTemplateId(templateId: string): Promise<PageTemplateBlock[]> {
    return this.repo.findByTemplateId(templateId);
  }
}
