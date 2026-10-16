import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager, Repository } from 'typeorm';

import type { PersistenceContext } from 'src/shared/domain/persistence-context';

import type { TemplateVersion } from '../../../../domain/aggregates/template-version/template-version.aggregate';
import { TemplateVersionStatus } from '../../../../domain/enums/template-version-status.enum';
import type { TemplateVersionRepository } from '../../../../domain/repositories/template-version.repository';
import { PageTemplateVersionOrmEntity } from '../entities/page-template-version.orm-entity';
import { TemplateVersionMapper } from '../mappers/template-version.mapper';

@Injectable()
export class TypeOrmTemplateVersionRepository implements TemplateVersionRepository {
  constructor(private readonly dataSource: DataSource) {}

  async create(
    version: TemplateVersion,
    context?: PersistenceContext,
  ): Promise<TemplateVersion> {
    return this.save(version, context);
  }

  async save(
    version: TemplateVersion,
    context?: PersistenceContext,
  ): Promise<TemplateVersion> {
    const repository = this.getRepo(context);

    const saved = await repository.save(TemplateVersionMapper.toOrm(version));

    return TemplateVersionMapper.toDomain(saved);
  }

  async findById(
    id: string,
    context?: PersistenceContext,
  ): Promise<TemplateVersion | null> {
    const repository = this.getRepo(context);

    const entity = await repository.findOne({
      where: { id },
    });

    return entity ? TemplateVersionMapper.toDomain(entity) : null;
  }

  async findByTemplateId(
    templateId: string,
    context?: PersistenceContext,
  ): Promise<TemplateVersion[]> {
    const repository = this.getRepo(context);

    const entities = await repository.find({
      where: { templateId },
      order: {
        versionNumber: 'ASC',
        id: 'ASC',
      },
    });

    return entities.map((entity) => TemplateVersionMapper.toDomain(entity));
  }

  async findPublishedByTemplateId(
    templateId: string,
    context?: PersistenceContext,
  ): Promise<TemplateVersion | null> {
    const repository = this.getRepo(context);

    const entity = await repository.findOne({
      where: {
        templateId,
        status: TemplateVersionStatus.PUBLISHED,
      },
      order: {
        versionNumber: 'DESC',
        id: 'DESC',
      },
    });

    return entity ? TemplateVersionMapper.toDomain(entity) : null;
  }

  async findLatestByTemplateId(
    templateId: string,
    context?: PersistenceContext,
  ): Promise<TemplateVersion | null> {
    const repository = this.getRepo(context);

    const entity = await repository.findOne({
      where: { templateId },
      order: {
        versionNumber: 'DESC',
        id: 'DESC',
      },
    });

    return entity ? TemplateVersionMapper.toDomain(entity) : null;
  }

  async findByIdForUpdate(
    id: string,
    context?: PersistenceContext,
  ): Promise<TemplateVersion | null> {
    const repository = this.getRepo(context);

    const entity = await repository
      .createQueryBuilder('version')
      .where('version.id = :id', { id })
      .setLock('pessimistic_write')
      .getOne();

    return entity ? TemplateVersionMapper.toDomain(entity) : null;
  }

  async getNextVersionNumber(
    templateId: string,
    context?: PersistenceContext,
  ): Promise<number> {
    const repository = this.getRepo(context);

    const latest = await repository.findOne({
      where: {
        templateId,
      },
      order: {
        versionNumber: 'DESC',
        id: 'DESC',
      },
    });

    return latest ? latest.versionNumber + 1 : 1;
  }

  private getRepo(
    context?: PersistenceContext,
  ): Repository<PageTemplateVersionOrmEntity> {
    const manager = context as EntityManager | undefined;

    return manager
      ? manager.getRepository(PageTemplateVersionOrmEntity)
      : this.dataSource.getRepository(PageTemplateVersionOrmEntity);
  }
}
