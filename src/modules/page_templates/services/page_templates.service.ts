import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PageTemplate } from '../domain/entities/page_template.entity';
import type { PageTemplatesRepository } from '../interfaces/repositories/page_templates.repository.interface';
import type { PageTemplatesService } from '../interfaces/services/page_templates.service.interface';
import { PAGE_TEMPLATE_TYPES } from '../interfaces/types';

@Injectable()
export class PageTemplatesServiceImpl implements PageTemplatesService {
  constructor(
    @Inject(PAGE_TEMPLATE_TYPES.repositories.PageTemplatesRepository)
    private readonly repo: PageTemplatesRepository,
  ) {}

  async findOne(id: string): Promise<PageTemplate> {
    const template = await this.repo.findOne(id);
    if (!template) {
      throw new NotFoundException(`Page Template with ID ${id} not found`);
    }
    return template;
  }
}
