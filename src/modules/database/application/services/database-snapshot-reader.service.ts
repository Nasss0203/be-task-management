import { Inject, Injectable } from '@nestjs/common';

import type { PersistenceContext } from 'src/shared/domain/persistence-context';

import { DATABASE_TYPES } from '../../database.types';
import type { DatabaseRepository } from '../../domain/repositories/database.repository';
import type { DatabaseRowRepository } from '../../domain/repositories/database-row.repository';
import type { DatabaseViewRepository } from '../../domain/repositories/database-view.repository';
import type {
  DatabaseSnapshot,
  DatabaseSnapshotDatabase,
  DatabaseSnapshotProperty,
  DatabaseSnapshotReaderPort,
  DatabaseSnapshotRow,
  DatabaseSnapshotView,
} from '../ports/database-snapshot-reader.port';

@Injectable()
export class DatabaseSnapshotReaderService implements DatabaseSnapshotReaderPort {
  constructor(
    @Inject(DATABASE_TYPES.repositories.DatabaseRepository)
    private readonly databaseRepository: DatabaseRepository,
    @Inject(DATABASE_TYPES.repositories.DatabaseRowRepository)
    private readonly databaseRowRepository: DatabaseRowRepository,
    @Inject(DATABASE_TYPES.repositories.DatabaseViewRepository)
    private readonly databaseViewRepository: DatabaseViewRepository,
  ) {}

  async getDatabaseSnapshot(
    databaseId: string,
    context?: PersistenceContext,
  ): Promise<DatabaseSnapshot | null> {
    const database = await this.databaseRepository.findById(
      databaseId,
      context,
    );

    if (!database) {
      return null;
    }

    const [rows, views] = await Promise.all([
      this.databaseRowRepository.findByDatabaseId(databaseId, context),
      this.databaseViewRepository.findByDatabaseId(databaseId, context),
    ]);

    const snapshotDatabase: DatabaseSnapshotDatabase = {
      id: database.getId(),
      pageId: database.getPageId(),
      name: database.getName(),
    };

    const snapshotProperties: DatabaseSnapshotProperty[] = database
      .getProperties()
      .map((property) => ({
        id: property.getId(),
        databaseId: property.getDatabaseId(),
        name: property.getName(),
        type: property.getType(),
        isDefault: property.getIsDefault(),
        isHideable: property.getIsHideable(),
        position: property.getPosition(),
        options: property.getOptions().map((option) => ({
          id: option.getId(),
          propertyId: property.getId(),
          name: option.getName(),
          color: option.getColor(),
          position: option.getPosition(),
        })),
      }));

    const snapshotRows: DatabaseSnapshotRow[] = rows.map((row) => ({
      id: row.getId(),
      databaseId: row.getDatabaseId(),
      values: row.getValues().map((value) => ({
        id: value.getId(),
        rowId: value.getRowId(),
        propertyId: value.getPropertyId(),
        value: value.getValue(),
      })),
    }));

    const snapshotViews: DatabaseSnapshotView[] = views.map((view) => ({
      id: view.getId(),
      databaseId: view.getDatabaseId(),
      name: view.getName(),
      type: view.getType(),
      position: view.getPosition(),
      properties: view.getProperties().map((property) => ({
        id: property.getId(),
        viewId: property.getViewId(),
        propertyId: property.getPropertyId(),
        position: property.getPosition(),
        visible: property.isVisible(),
        width: property.getWidth(),
      })),
    }));

    return {
      database: snapshotDatabase,
      properties: snapshotProperties,
      rows: snapshotRows,
      views: snapshotViews,
    };
  }
}
