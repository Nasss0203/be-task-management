import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PageTemplate } from '../domain/entities/page_template.entity';
import type { PageTemplatesRepository } from '../interfaces/repositories/page_templates.repository.interface';

@Injectable()
export class PageTemplatesRepositoryImpl implements PageTemplatesRepository {
  constructor(
    @InjectRepository(PageTemplate)
    private readonly repo: Repository<PageTemplate>,
  ) {}

  async findAll(where?: import('typeorm').FindOptionsWhere<PageTemplate>): Promise<PageTemplate[]> {
    return this.repo.find({
      where: where || { isSystem: true },
      order: { createdAt: 'ASC' },
    });
  }

  async findOne(id: string): Promise<PageTemplate | null> {
    return this.repo.findOne({ where: { id } });
  }
}
