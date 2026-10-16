import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';

import type { PersistenceContext } from 'src/shared/domain/persistence-context';

import type { PageTemplateDatabase } from '../../../../domain/aggregates/template-database/page-template-database.aggregate';
import type { PageTemplateDatabaseSnapshotRepository } from '../../../../domain/repositories/page-template-database-snapshot.repository';
import { PageTemplateDatabaseOrmEntity } from '../entities/page-template-database.orm-entity';
import { PageTemplateDatabasePropertyOrmEntity } from '../entities/page-template-database-property.orm-entity';
import { PageTemplateDatabasePropertyOptionOrmEntity } from '../entities/page-template-database-property-option.orm-entity';
import { PageTemplateDatabaseRowOrmEntity } from '../entities/page-template-database-row.orm-entity';
import { PageTemplateDatabaseRowValueOrmEntity } from '../entities/page-template-database-row-value.orm-entity';
import { PageTemplateDatabaseViewOrmEntity } from '../entities/page-template-database-view.orm-entity';
import { PageTemplateDatabaseViewPropertyOrmEntity } from '../entities/page-template-database-view-property.orm-entity';
import { PageTemplateDatabaseMapper } from '../mappers/page-template-database.mapper';
import { PageTemplateDatabasePropertyOptionMapper } from '../mappers/page-template-database-property-option.mapper';
import { PageTemplateDatabaseRowValueMapper } from '../mappers/page-template-database-row-value.mapper';
import { PageTemplateDatabaseViewPropertyMapper } from '../mappers/page-template-database-view-property.mapper';

@Injectable()
export class TypeOrmPageTemplateDatabaseSnapshotRepository implements PageTemplateDatabaseSnapshotRepository {
  constructor(private readonly dataSource: DataSource) {}

  async saveMany(
    databases: PageTemplateDatabase[],
    context?: PersistenceContext,
  ): Promise<PageTemplateDatabase[]> {
    if (databases.length === 0) {
      return [];
    }

    const manager = this.getManager(context);

    const databaseEntities: PageTemplateDatabaseOrmEntity[] = [];
    const propertyEntities: PageTemplateDatabasePropertyOrmEntity[] = [];
    const optionEntities: PageTemplateDatabasePropertyOptionOrmEntity[] = [];
    const rowEntities: PageTemplateDatabaseRowOrmEntity[] = [];
    const rowValueEntities: PageTemplateDatabaseRowValueOrmEntity[] = [];
    const viewEntities: PageTemplateDatabaseViewOrmEntity[] = [];
    const viewPropertyEntities: PageTemplateDatabaseViewPropertyOrmEntity[] =
      [];

    for (const database of databases) {
      const dbEntity = new PageTemplateDatabaseOrmEntity();
      dbEntity.id = database.getId();
      dbEntity.versionId = database.getVersionId();
      dbEntity.name = database.getName();
      databaseEntities.push(dbEntity);

      for (const property of database.getProperties()) {
        const propEntity = new PageTemplateDatabasePropertyOrmEntity();
        propEntity.id = property.getId();
        propEntity.templateDatabaseId = property.getTemplateDatabaseId();
        propEntity.name = property.getName();
        propEntity.type = property.getType();
        propEntity.isDefault = property.getIsDefault();
        propEntity.isHideable = property.getIsHideable();
        propEntity.position = property.getPosition();
        propertyEntities.push(propEntity);

        for (const option of property.getOptions()) {
          optionEntities.push(
            PageTemplateDatabasePropertyOptionMapper.toOrm(option),
          );
        }
      }

      for (const row of database.getRows()) {
        const rowEntity = new PageTemplateDatabaseRowOrmEntity();
        rowEntity.id = row.getId();
        rowEntity.templateDatabaseId = row.getTemplateDatabaseId();
        rowEntities.push(rowEntity);

        for (const value of row.getValues()) {
          rowValueEntities.push(
            PageTemplateDatabaseRowValueMapper.toOrm(value),
          );
        }
      }

      for (const view of database.getViews()) {
        const viewEntity = new PageTemplateDatabaseViewOrmEntity();
        viewEntity.id = view.getId();
        viewEntity.templateDatabaseId = view.getTemplateDatabaseId();
        viewEntity.name = view.getName();
        viewEntity.type = view.getType();
        viewEntity.position = view.getPosition();
        viewEntities.push(viewEntity);

        for (const viewProperty of view.getProperties()) {
          viewPropertyEntities.push(
            PageTemplateDatabaseViewPropertyMapper.toOrm(viewProperty),
          );
        }
      }
    }

    if (databaseEntities.length > 0) {
      await manager
        .getRepository(PageTemplateDatabaseOrmEntity)
        .save(databaseEntities);
    }

    if (propertyEntities.length > 0) {
      await manager
        .getRepository(PageTemplateDatabasePropertyOrmEntity)
        .save(propertyEntities);
    }

    if (optionEntities.length > 0) {
      await manager
        .getRepository(PageTemplateDatabasePropertyOptionOrmEntity)
        .save(optionEntities);
    }

    if (rowEntities.length > 0) {
      await manager
        .getRepository(PageTemplateDatabaseRowOrmEntity)
        .save(rowEntities);
    }

    if (rowValueEntities.length > 0) {
      await manager
        .getRepository(PageTemplateDatabaseRowValueOrmEntity)
        .save(rowValueEntities);
    }

    if (viewEntities.length > 0) {
      await manager
        .getRepository(PageTemplateDatabaseViewOrmEntity)
        .save(viewEntities);
    }

    if (viewPropertyEntities.length > 0) {
      await manager
        .getRepository(PageTemplateDatabaseViewPropertyOrmEntity)
        .save(viewPropertyEntities);
    }

    return databases;
  }

  async findByVersionId(
    versionId: string,
    context?: PersistenceContext,
  ): Promise<PageTemplateDatabase[]> {
    const manager = this.getManager(context);

    const entities = await manager
      .getRepository(PageTemplateDatabaseOrmEntity)
      .find({
        where: { versionId },
        relations: {
          properties: {
            options: true,
          },
          rows: {
            values: true,
          },
          views: {
            properties: true,
          },
        },
        order: {
          id: 'ASC',
          properties: {
            position: 'ASC',
            options: {
              position: 'ASC',
            },
          },
          views: {
            position: 'ASC',
            properties: {
              position: 'ASC',
            },
          },
        },
      });

    return entities.map((entity) =>
      PageTemplateDatabaseMapper.toDomain(entity),
    );
  }

  private getManager(context?: PersistenceContext): EntityManager {
    return (context as EntityManager | undefined) ?? this.dataSource.manager;
  }
}
