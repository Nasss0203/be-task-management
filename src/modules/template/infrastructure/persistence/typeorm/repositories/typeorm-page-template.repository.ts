import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager, Repository } from 'typeorm';

import type { PersistenceContext } from 'src/shared/domain/persistence-context';

import type { PageTemplate } from '../../../../domain/aggregates/page-template/page-template.aggregate';
import type { PageTemplateRepository } from '../../../../domain/repositories/page-template.repository';
import { PageTemplateOrmEntity } from '../entities/page-template.orm-entity';
import { PageTemplateMapper } from '../mappers/page-template.mapper';

@Injectable()
export class TypeOrmPageTemplateRepository implements PageTemplateRepository {
  constructor(private readonly dataSource: DataSource) {}

  async create(
    template: PageTemplate,
    context?: PersistenceContext,
  ): Promise<PageTemplate> {
    return this.save(template, context);
  }

  async save(
    template: PageTemplate,
    context?: PersistenceContext,
  ): Promise<PageTemplate> {
    const repository = this.getRepo(context);

    const saved = await repository.save(PageTemplateMapper.toOrm(template));

    return PageTemplateMapper.toDomain(saved);
  }

  async findById(
    id: string,
    context?: PersistenceContext,
  ): Promise<PageTemplate | null> {
    const repository = this.getRepo(context);

    const entity = await repository.findOne({
      where: { id },
    });

    return entity ? PageTemplateMapper.toDomain(entity) : null;
  }

  async findByWorkspaceId(
    workspaceId: string,
    context?: PersistenceContext,
  ): Promise<PageTemplate[]> {
    const repository = this.getRepo(context);

    const entities = await repository.find({
      where: { workspaceId },
      order: {
        createdAt: 'DESC',
        id: 'DESC',
      },
    });

    return entities.map((entity) => PageTemplateMapper.toDomain(entity));
  }

  async findByCreatorId(
    createdBy: string,
    context?: PersistenceContext,
  ): Promise<PageTemplate[]> {
    const repository = this.getRepo(context);

    const entities = await repository.find({
      where: { createdBy },
      order: {
        createdAt: 'DESC',
        id: 'DESC',
      },
    });

    return entities.map((entity) => PageTemplateMapper.toDomain(entity));
  }

  async findByIdForUpdate(
    id: string,
    context?: PersistenceContext,
  ): Promise<PageTemplate | null> {
    const repository = this.getRepo(context);

    const entity = await repository
      .createQueryBuilder('template')
      .where('template.id = :id', { id })
      .setLock('pessimistic_write')
      .getOne();

    return entity ? PageTemplateMapper.toDomain(entity) : null;
  }

  private getRepo(
    context?: PersistenceContext,
  ): Repository<PageTemplateOrmEntity> {
    const manager = context as EntityManager | undefined;

    return manager
      ? manager.getRepository(PageTemplateOrmEntity)
      : this.dataSource.getRepository(PageTemplateOrmEntity);
  }
}
