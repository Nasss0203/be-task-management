import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager, Repository } from 'typeorm';

import type { PersistenceContext } from 'src/shared/domain/persistence-context';
import type { TemplateCategory } from '../../../../domain/aggregates/template-category/template-category.aggregate';
import type { TemplateCategoryRepository } from '../../../../domain/repositories/template-category.repository';
import { TemplateCategoryOrmEntity } from '../entities/template-category.orm-entity';
import { TemplateCategoryMapper } from '../mappers/template-category.mapper';

@Injectable()
export class TypeOrmTemplateCategoryRepository implements TemplateCategoryRepository {
  constructor(private readonly dataSource: DataSource) {}

  async create(
    category: TemplateCategory,
    context?: PersistenceContext,
  ): Promise<TemplateCategory> {
    return this.save(category, context);
  }

  async save(
    category: TemplateCategory,
    context?: PersistenceContext,
  ): Promise<TemplateCategory> {
    const repository = this.getRepo(context);
    const saved = await repository.save(TemplateCategoryMapper.toOrm(category));
    return TemplateCategoryMapper.toDomain(saved);
  }

  async findById(
    id: string,
    context?: PersistenceContext,
  ): Promise<TemplateCategory | null> {
    const repository = this.getRepo(context);
    const entity = await repository.findOne({ where: { id } });
    return entity ? TemplateCategoryMapper.toDomain(entity) : null;
  }

  async findBySlug(
    slug: string,
    context?: PersistenceContext,
  ): Promise<TemplateCategory | null> {
    const repository = this.getRepo(context);
    const entity = await repository.findOne({
      where: { slug: slug.trim().toLowerCase() },
    });
    return entity ? TemplateCategoryMapper.toDomain(entity) : null;
  }

  async existsBySlug(
    slug: string,
    excludeId?: string,
    context?: PersistenceContext,
  ): Promise<boolean> {
    const repository = this.getRepo(context);
    const qb = repository
      .createQueryBuilder('category')
      .where('category.slug = :slug', { slug: slug.trim().toLowerCase() });

    if (excludeId) {
      qb.andWhere('category.id != :excludeId', { excludeId });
    }

    const count = await qb.getCount();
    return count > 0;
  }

  async findAll(context?: PersistenceContext): Promise<TemplateCategory[]> {
    const repository = this.getRepo(context);
    const entities = await repository.find({
      order: {
        sortOrder: 'ASC',
        name: 'ASC',
      },
    });
    return entities.map((entity) => TemplateCategoryMapper.toDomain(entity));
  }

  async findAllActive(
    context?: PersistenceContext,
  ): Promise<TemplateCategory[]> {
    const repository = this.getRepo(context);

    const entities = await repository.find({
      where: {
        isActive: true,
      },
      order: {
        sortOrder: 'ASC',
        name: 'ASC',
      },
    });

    return entities.map((entity) => TemplateCategoryMapper.toDomain(entity));
  }

  async findByIdsForShare(
    ids: string[],
    context: PersistenceContext,
  ): Promise<TemplateCategory[]> {
    if (!context) {
      throw new Error('findByIdsForShare requires a transaction context');
    }
    if (ids.length === 0) {
      return [];
    }

    const sortedIds = [...new Set(ids)].sort();

    const repository = this.getRepo(context);

    const entities = await repository
      .createQueryBuilder('category')
      .where('category.id IN (:...ids)', {
        ids: sortedIds,
      })
      .orderBy('category.id', 'ASC')
      .setLock('pessimistic_read')
      .getMany();

    return entities.map((entity) => TemplateCategoryMapper.toDomain(entity));
  }

  private getRepo(
    context?: PersistenceContext,
  ): Repository<TemplateCategoryOrmEntity> {
    const manager = context as EntityManager | undefined;

    return manager
      ? manager.getRepository(TemplateCategoryOrmEntity)
      : this.dataSource.getRepository(TemplateCategoryOrmEntity);
  }
}
