import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager, Repository } from 'typeorm';

import type { PersistenceContext } from 'src/shared/domain/persistence-context';

import type { PageTemplateBlock } from '../../../../domain/entities/page-template-block.entity';
import type { PageTemplateBlockRepository } from '../../../../domain/repositories/page-template-block.repository';
import { PageTemplateBlockOrmEntity } from '../entities/page-template-block.orm-entity';
import { PageTemplateBlockMapper } from '../mappers/page-template-block.mapper';

@Injectable()
export class TypeOrmPageTemplateBlockRepository implements PageTemplateBlockRepository {
  constructor(private readonly dataSource: DataSource) {}

  async create(
    block: PageTemplateBlock,
    context?: PersistenceContext,
  ): Promise<PageTemplateBlock> {
    return this.save(block, context);
  }

  async save(
    block: PageTemplateBlock,
    context?: PersistenceContext,
  ): Promise<PageTemplateBlock> {
    const repository = this.getRepo(context);

    const saved = await repository.save(PageTemplateBlockMapper.toOrm(block));

    return PageTemplateBlockMapper.toDomain(saved);
  }

  async findById(
    id: string,
    context?: PersistenceContext,
  ): Promise<PageTemplateBlock | null> {
    const repository = this.getRepo(context);

    const entity = await repository.findOne({
      where: { id },
    });

    return entity ? PageTemplateBlockMapper.toDomain(entity) : null;
  }

  async findByVersionId(
    versionId: string,
    context?: PersistenceContext,
  ): Promise<PageTemplateBlock[]> {
    const repository = this.getRepo(context);

    const entities = await repository.find({
      where: { versionId },
      order: {
        orderIndex: 'ASC',
        id: 'ASC',
      },
    });

    return entities.map((entity) => PageTemplateBlockMapper.toDomain(entity));
  }

  async deleteById(id: string, context?: PersistenceContext): Promise<void> {
    const repository = this.getRepo(context);

    await repository.delete({ id });
  }

  async deleteByVersionId(
    versionId: string,
    context?: PersistenceContext,
  ): Promise<void> {
    const repository = this.getRepo(context);

    await repository.delete({ versionId });
  }

  async saveMany(
    blocks: PageTemplateBlock[],
    context?: PersistenceContext,
  ): Promise<PageTemplateBlock[]> {
    if (blocks.length === 0) {
      return [];
    }

    const repository = this.getRepo(context);

    const entities = blocks.map((block) =>
      PageTemplateBlockMapper.toOrm(block),
    );

    const saved = await repository.save(entities);

    return saved.map((entity) => PageTemplateBlockMapper.toDomain(entity));
  }

  private getRepo(
    context?: PersistenceContext,
  ): Repository<PageTemplateBlockOrmEntity> {
    const manager = context as EntityManager | undefined;

    return manager
      ? manager.getRepository(PageTemplateBlockOrmEntity)
      : this.dataSource.getRepository(PageTemplateBlockOrmEntity);
  }
}
