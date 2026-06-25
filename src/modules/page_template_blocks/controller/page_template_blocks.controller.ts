import { Controller, Get, Param, Inject } from '@nestjs/common';
import { PublicReadRateLimit } from 'src/common/decorator/rate-limit.decorator';
import { PageTemplateBlock } from '../domain/entities/page_template_block.entity';
import { PAGE_TEMPLATE_BLOCK_TYPES } from '../interfaces/types';
import type { PageTemplateBlocksService } from '../interfaces/services/page_template_blocks.service.interface';

@Controller('page-template-blocks')
@PublicReadRateLimit()
export class PageTemplateBlocksController {
  constructor(
    @Inject(PAGE_TEMPLATE_BLOCK_TYPES.services.PageTemplateBlocksService)
    private readonly pageTemplateBlocksService: PageTemplateBlocksService,
  ) {}

  @Get('template/:templateId')
  async findByTemplateId(@Param('templateId') templateId: string): Promise<PageTemplateBlock[]> {
    return this.pageTemplateBlocksService.findByTemplateId(templateId);
  }
}
