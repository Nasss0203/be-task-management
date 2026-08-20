import { EntityManager } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { PageTemplateBlock } from 'src/modules/content/domain/entities/page-template-block.entity';
import type { PageTemplateBlockRepository } from 'src/modules/content/domain/repositories/page-template-block.repository';
import { PageTemplateBlockOrmEntity } from '../entities/page-template-block.orm-entity';
import { PageTemplateBlockMapper } from '../mappers/page-template-block.mapper';
import { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';

@Injectable()
export class TypeOrmPageTemplateBlockRepository implements PageTemplateBlockRepository {
  constructor(
    @InjectRepository(PageTemplateBlockOrmEntity)
    private readonly repo: Repository<PageTemplateBlockOrmEntity>,
  ) {}

  private resolveRepo(context?: PersistenceContext): Repository<PageTemplateBlockOrmEntity> {
    if (context) {
      return (context as EntityManager).getRepository(PageTemplateBlockOrmEntity);
    }
    return this.repo;
  }

  async findById(id: string, context?: PersistenceContext): Promise<PageTemplateBlock | null> {
    const orm = await this.resolveRepo(context).findOne({
      where: { id, },
    });
    return orm ? PageTemplateBlockMapper.toDomain(orm) : null;
  }

  async findByTemplateId(templateId: string, context?: PersistenceContext): Promise<PageTemplateBlock[]> {
    const orms = await this.resolveRepo(context).find({
      where: { templateId, },
      order: { orderIndex: 'ASC' },
    });
    return orms.map(PageTemplateBlockMapper.toDomain);
  }

  async save(block: PageTemplateBlock, context?: PersistenceContext): Promise<PageTemplateBlock> {
    const orm = PageTemplateBlockMapper.toOrm(block);
    const saved = await this.resolveRepo(context).save(orm);
    return PageTemplateBlockMapper.toDomain(saved);
  }

  async delete(id: string, context?: PersistenceContext): Promise<void> {
    await this.resolveRepo(context).softDelete(id);
  }
}
