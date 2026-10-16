import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager, Repository } from 'typeorm';

import type { PersistenceContext } from 'src/shared/domain/persistence-context';

import { TemplateVersionAsset } from '../../../../domain/entities/template-version-asset.entity';
import { TemplateVersionAssetType } from '../../../../domain/enums/template-version-asset-type.enum';
import type { TemplateVersionAssetRepository } from '../../../../domain/repositories/template-version-asset.repository';
import { TemplateVersionAssetOrmEntity } from '../entities/template-version-asset.orm-entity';
import { TemplateVersionAssetMapper } from '../mappers/template-version-asset.mapper';

@Injectable()
export class TypeOrmTemplateVersionAssetRepository implements TemplateVersionAssetRepository {
  constructor(private readonly dataSource: DataSource) {}

  async create(
    asset: TemplateVersionAsset,
    context?: PersistenceContext,
  ): Promise<TemplateVersionAsset> {
    return this.save(asset, context);
  }

  async save(
    asset: TemplateVersionAsset,
    context?: PersistenceContext,
  ): Promise<TemplateVersionAsset> {
    const repository = this.getRepo(context);
    const saved = await repository.save(
      TemplateVersionAssetMapper.toOrm(asset),
    );

    return TemplateVersionAssetMapper.toDomain(saved);
  }

  async findByVersionAndType(
    templateVersionId: string,
    assetType: TemplateVersionAssetType,
    context?: PersistenceContext,
  ): Promise<TemplateVersionAsset | null> {
    const repository = this.getRepo(context);
    const entity = await repository.findOne({
      where: { templateVersionId, assetType },
    });

    return entity ? TemplateVersionAssetMapper.toDomain(entity) : null;
  }

  private getRepo(
    context?: PersistenceContext,
  ): Repository<TemplateVersionAssetOrmEntity> {
    const manager = context as EntityManager | undefined;

    return manager
      ? manager.getRepository(TemplateVersionAssetOrmEntity)
      : this.dataSource.getRepository(TemplateVersionAssetOrmEntity);
  }
}
