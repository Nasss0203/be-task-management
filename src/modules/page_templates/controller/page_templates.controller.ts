import { Controller, Get, Param, Inject } from '@nestjs/common';
import { PublicReadRateLimit } from 'src/common/decorator/rate-limit.decorator';
import { PageTemplate } from '../domain/entities/page_template.entity';
import { PAGE_TEMPLATE_TYPES } from '../interfaces/types';
import type { PageTemplatesService } from '../interfaces/services/page_templates.service.interface';

@Controller('page-templates')
@PublicReadRateLimit()
export class PageTemplatesController {
  constructor(
    @Inject(PAGE_TEMPLATE_TYPES.services.PageTemplatesService)
    private readonly pageTemplatesService: PageTemplatesService,
  ) {}

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<PageTemplate> {
    return this.pageTemplatesService.findOne(id);
  }
}
