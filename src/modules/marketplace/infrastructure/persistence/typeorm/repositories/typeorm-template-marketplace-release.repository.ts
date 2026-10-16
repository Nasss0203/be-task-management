import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager, Repository } from 'typeorm';

import type { PersistenceContext } from 'src/shared/domain/persistence-context';
import type { TemplateMarketplaceRelease } from '../../../../domain/aggregates/template-marketplace-release/template-marketplace-release.aggregate';
import type { TemplateMarketplaceReleaseRepository } from '../../../../domain/repositories/template-marketplace-release.repository';
import { TemplateMarketplaceReleaseOrmEntity } from '../entities/template-marketplace-release.orm-entity';
import { TemplateMarketplaceReleaseMapper } from '../mappers/template-marketplace-release.mapper';

@Injectable()
export class TypeOrmTemplateMarketplaceReleaseRepository implements TemplateMarketplaceReleaseRepository {
  constructor(private readonly dataSource: DataSource) {}

  async findById(
    id: string,
    context?: PersistenceContext,
  ): Promise<TemplateMarketplaceRelease | null> {
    const entity = await this.getRepo(context).findOne({ where: { id } });
    return entity ? TemplateMarketplaceReleaseMapper.toDomain(entity) : null;
  }

  async findByTemplateAndVersion(
    templateId: string,
    versionId: string,
    context?: PersistenceContext,
  ): Promise<TemplateMarketplaceRelease | null> {
    const entity = await this.getRepo(context).findOne({
      where: { templateId, versionId },
    });
    return entity ? TemplateMarketplaceReleaseMapper.toDomain(entity) : null;
  }

  async existsByTemplateAndVersion(
    templateId: string,
    versionId: string,
    context?: PersistenceContext,
  ): Promise<boolean> {
    return this.getRepo(context).existsBy({ templateId, versionId });
  }

  async findByTemplateId(
    templateId: string,
    context?: PersistenceContext,
  ): Promise<TemplateMarketplaceRelease[]> {
    const entities = await this.getRepo(context).find({
      where: { templateId },
      order: { releasedAt: 'DESC', id: 'DESC' },
    });
    return entities.map(TemplateMarketplaceReleaseMapper.toDomain);
  }

  async save(
    release: TemplateMarketplaceRelease,
    context?: PersistenceContext,
  ): Promise<TemplateMarketplaceRelease> {
    const entity = TemplateMarketplaceReleaseMapper.toOrm(release);
    await this.getRepo(context).insert({
      id: entity.id,
      templateId: entity.templateId,
      versionId: entity.versionId,
      releasedAt: entity.releasedAt,
      releasedBy: entity.releasedBy,
      offerTypeAtRelease: entity.offerTypeAtRelease,
    });
    return release;
  }

  async insertIfAbsent(
    release: TemplateMarketplaceRelease,
    context?: PersistenceContext,
  ): Promise<void> {
    const entity = TemplateMarketplaceReleaseMapper.toOrm(release);
    await this.getRepo(context)
      .createQueryBuilder()
      .insert()
      .values({
        id: entity.id,
        templateId: entity.templateId,
        versionId: entity.versionId,
        releasedAt: entity.releasedAt,
        releasedBy: entity.releasedBy,
        offerTypeAtRelease: entity.offerTypeAtRelease,
      })
      .onConflict('("template_id", "version_id") DO NOTHING')
      .execute();
  }

  private getRepo(
    context?: PersistenceContext,
  ): Repository<TemplateMarketplaceReleaseOrmEntity> {
    const manager = context as EntityManager | undefined;
    return manager
      ? manager.getRepository(TemplateMarketplaceReleaseOrmEntity)
      : this.dataSource.getRepository(TemplateMarketplaceReleaseOrmEntity);
  }
}
