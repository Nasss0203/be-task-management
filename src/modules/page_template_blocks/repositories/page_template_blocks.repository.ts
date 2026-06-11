import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PageTemplateBlock } from '../domain/entities/page_template_block.entity';
import type { PageTemplateBlocksRepository } from '../interfaces/repositories/page_template_blocks.repository.interface';

@Injectable()
export class PageTemplateBlocksRepositoryImpl implements PageTemplateBlocksRepository {
  constructor(
    @InjectRepository(PageTemplateBlock)
    private readonly repo: Repository<PageTemplateBlock>,
  ) {}

  async findByTemplateId(templateId: string): Promise<PageTemplateBlock[]> {
    return this.repo.find({
      where: { templateId },
      order: { orderIndex: 'ASC' },
    });
  }
}
