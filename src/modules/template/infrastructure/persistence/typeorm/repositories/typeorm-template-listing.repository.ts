import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager, Repository } from 'typeorm';

import type { PersistenceContext } from 'src/shared/domain/persistence-context';

import type { TemplateListing } from '../../../../domain/aggregates/template-listing/template-listing.aggregate';
import type { TemplateListingRepository } from '../../../../domain/repositories/template-listing.repository';
import { TemplateListingOrmEntity } from '../entities/template-listing.orm-entity';
import { TemplateListingMapper } from '../mappers/template-listing.mapper';

@Injectable()
export class TypeOrmTemplateListingRepository implements TemplateListingRepository {
  constructor(private readonly dataSource: DataSource) {}

  async create(
    listing: TemplateListing,
    context?: PersistenceContext,
  ): Promise<TemplateListing> {
    return this.save(listing, context);
  }

  async save(
    listing: TemplateListing,
    context?: PersistenceContext,
  ): Promise<TemplateListing> {
    const repository = this.getRepo(context);

    const saved = await repository.save(TemplateListingMapper.toOrm(listing));

    return TemplateListingMapper.toDomain(saved);
  }

  async findById(
    id: string,
    context?: PersistenceContext,
  ): Promise<TemplateListing | null> {
    const repository = this.getRepo(context);

    const entity = await repository.findOne({
      where: { id },
    });

    return entity ? TemplateListingMapper.toDomain(entity) : null;
  }

  async findByTemplateId(
    templateId: string,
    context?: PersistenceContext,
  ): Promise<TemplateListing | null> {
    const repository = this.getRepo(context);

    const entity = await repository.findOne({
      where: { templateId },
    });

    return entity ? TemplateListingMapper.toDomain(entity) : null;
  }

  private getRepo(
    context?: PersistenceContext,
  ): Repository<TemplateListingOrmEntity> {
    const manager = context as EntityManager | undefined;

    return manager
      ? manager.getRepository(TemplateListingOrmEntity)
      : this.dataSource.getRepository(TemplateListingOrmEntity);
  }
}
