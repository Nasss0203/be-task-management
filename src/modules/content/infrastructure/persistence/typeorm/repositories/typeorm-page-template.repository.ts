import { EntityManager } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { PageTemplate } from 'src/modules/content/domain/aggregates/page-template/page-template.aggregate';
import type { PageTemplateRepository } from 'src/modules/content/domain/repositories/page-template.repository';
import { PageTemplateOrmEntity } from '../entities/page-template.orm-entity';
import { PageTemplateMapper } from '../mappers/page-template.mapper';
import { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';

@Injectable()
export class TypeOrmPageTemplateRepository implements PageTemplateRepository {
  constructor(
    @InjectRepository(PageTemplateOrmEntity)
    private readonly repo: Repository<PageTemplateOrmEntity>,
  ) {}

  private resolveRepo(
    context?: PersistenceContext,
  ): Repository<PageTemplateOrmEntity> {
    if (context) {
      return (context as EntityManager).getRepository(PageTemplateOrmEntity);
    }
    return this.repo;
  }

  async findById(
    id: string,
    context?: PersistenceContext,
  ): Promise<PageTemplate | null> {
    const orm = await this.resolveRepo(context).findOne({
      where: { id },
    });
    return orm ? PageTemplateMapper.toDomain(orm) : null;
  }

  async findByWorkspace(
    workspaceId: string,
    context?: PersistenceContext,
  ): Promise<PageTemplate[]> {
    const orms = await this.resolveRepo(context).find({
      where: [{ workspaceId }, { isSystem: true }],
      order: { createdAt: 'DESC' },
    });
    return orms.map(PageTemplateMapper.toDomain);
  }

  async save(
    template: PageTemplate,
    context?: PersistenceContext,
  ): Promise<PageTemplate> {
    const orm = PageTemplateMapper.toOrm(template);
    const saved = await this.resolveRepo(context).save(orm);
    return PageTemplateMapper.toDomain(saved);
  }

  async delete(id: string, context?: PersistenceContext): Promise<void> {
    await this.resolveRepo(context).softDelete(id);
  }
}
