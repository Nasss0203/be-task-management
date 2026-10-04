import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';

import type { PersistenceContext } from 'src/shared/domain/persistence-context';
import { PERSISTENCE_TYPES } from 'src/shared/infrastructure/persistence/persistence.types';
import type { UnitOfWork } from 'src/shared/infrastructure/persistence/unit-of-work.interface';

import { DATABASE_TYPES } from '../../database.types';
import { DatabaseProperty } from '../../domain/aggregates/database/database-property.entity';
import { Database } from '../../domain/aggregates/database/database.aggregate';
import { PropertyOption } from '../../domain/aggregates/database/property-option.entity';
import { DatabaseRow } from '../../domain/aggregates/row/database-row.aggregate';
import { RowValue } from '../../domain/aggregates/row/row-value.entity';
import type { RowValueData } from '../../domain/aggregates/row/row-value.type';
import { DatabaseView } from '../../domain/aggregates/view/database-view.aggregate';
import { PropertyType } from '../../domain/enums/property-type.enum';
import type { DatabaseRepository } from '../../domain/repositories/database.repository';
import type { DatabaseRowRepository } from '../../domain/repositories/database-row.repository';
import type { DatabaseViewRepository } from '../../domain/repositories/database-view.repository';
import type {
  DatabaseProvisioningPort,
  DatabaseProvisioningResult,
  ProvisionDatabasePropertySnapshot,
  ProvisionDatabaseSnapshot,
  ProvisionDatabasesInput,
} from '../ports/database-provisioning.port';

interface MaterializedDatabase {
  database: Database;
  rows: DatabaseRow[];
  views: DatabaseView[];
}

@Injectable()
export class DatabaseProvisioningService implements DatabaseProvisioningPort {
  constructor(
    @Inject(DATABASE_TYPES.repositories.DatabaseRepository)
    private readonly databaseRepository: DatabaseRepository,
    @Inject(DATABASE_TYPES.repositories.DatabaseRowRepository)
    private readonly databaseRowRepository: DatabaseRowRepository,
    @Inject(DATABASE_TYPES.repositories.DatabaseViewRepository)
    private readonly databaseViewRepository: DatabaseViewRepository,
    @Inject(PERSISTENCE_TYPES.UnitOfWork)
    private readonly uow: UnitOfWork,
  ) {}

  async provisionDatabases(
    input: ProvisionDatabasesInput,
    context?: PersistenceContext,
  ): Promise<DatabaseProvisioningResult> {
    const emptyResult = this.createEmptyResult();

    if (input.databases.length === 0) {
      return emptyResult;
    }

    const provision = async (
      manager: PersistenceContext,
    ): Promise<DatabaseProvisioningResult> => {
      this.validateUniqueSourceIds(input.databases);

      const result = this.createEmptyResult();
      const materialized = input.databases.map((snapshot) =>
        this.materializeDatabase(input.pageId, snapshot, result),
      );

      for (const graph of materialized) {
        await this.databaseRepository.save(graph.database, manager);
      }

      for (const graph of materialized) {
        for (const row of graph.rows) {
          await this.databaseRowRepository.save(row, manager);
        }
      }

      for (const graph of materialized) {
        for (const view of graph.views) {
          await this.databaseViewRepository.save(view, manager);
        }
      }

      return result;
    };

    if (context === undefined) {
      return this.uow.runInTransaction(provision);
    }

    return provision(context);
  }

  private materializeDatabase(
    pageId: string,
    snapshot: ProvisionDatabaseSnapshot,
    result: DatabaseProvisioningResult,
  ): MaterializedDatabase {
    const databaseId = this.createLiveId(snapshot.sourceId);
    result.databaseIdMap.set(snapshot.sourceId, databaseId);

    const propertiesBySourceId = new Map<
      string,
      ProvisionDatabasePropertySnapshot
    >();
    const livePropertiesBySourceId = new Map<string, DatabaseProperty>();
    const optionSourceIdsByProperty = new Map<string, Set<string>>();

    const properties = snapshot.properties.map((propertySnapshot) => {
      const propertyId = this.createLiveId(propertySnapshot.sourceId);
      result.propertyIdMap.set(propertySnapshot.sourceId, propertyId);
      propertiesBySourceId.set(propertySnapshot.sourceId, propertySnapshot);

      const optionSourceIds = new Set<string>();
      const options = propertySnapshot.options.map((optionSnapshot) => {
        const optionId = this.createLiveId(optionSnapshot.sourceId);
        result.optionIdMap.set(optionSnapshot.sourceId, optionId);
        optionSourceIds.add(optionSnapshot.sourceId);

        return new PropertyOption(
          optionId,
          optionSnapshot.name,
          optionSnapshot.color,
          optionSnapshot.position,
        );
      });

      optionSourceIdsByProperty.set(propertySnapshot.sourceId, optionSourceIds);

      const property = new DatabaseProperty(
        propertyId,
        databaseId,
        propertySnapshot.name,
        propertySnapshot.type,
        propertySnapshot.isDefault,
        propertySnapshot.isHideable,
        propertySnapshot.position,
        options,
      );

      livePropertiesBySourceId.set(propertySnapshot.sourceId, property);

      return property;
    });

    const database = Database.restore({
      id: databaseId,
      pageId,
      name: snapshot.name,
      properties,
    });

    const rows = snapshot.rows.map((rowSnapshot) => {
      const rowId = this.createLiveId(rowSnapshot.sourceId);
      result.rowIdMap.set(rowSnapshot.sourceId, rowId);

      const values = rowSnapshot.values.map((valueSnapshot) => {
        const propertySnapshot = propertiesBySourceId.get(
          valueSnapshot.propertySourceId,
        );
        const liveProperty = livePropertiesBySourceId.get(
          valueSnapshot.propertySourceId,
        );

        if (!propertySnapshot || !liveProperty) {
          throw new BadRequestException(
            `Row value property source ID "${valueSnapshot.propertySourceId}" does not belong to database "${snapshot.sourceId}"`,
          );
        }

        const value = this.remapRowValue(
          valueSnapshot.value,
          propertySnapshot,
          optionSourceIdsByProperty,
          result.optionIdMap,
        );

        return new RowValue(randomUUID(), rowId, liveProperty.getId(), value);
      });

      return DatabaseRow.restore({
        id: rowId,
        databaseId,
        values,
      });
    });

    const views = snapshot.views.map((viewSnapshot) => {
      const viewId = this.createLiveId(viewSnapshot.sourceId);
      result.viewIdMap.set(viewSnapshot.sourceId, viewId);

      const view = DatabaseView.create({
        id: viewId,
        databaseId,
        name: viewSnapshot.name,
        type: viewSnapshot.type,
        position: viewSnapshot.position,
      });

      for (const viewPropertySnapshot of viewSnapshot.properties) {
        const liveProperty = livePropertiesBySourceId.get(
          viewPropertySnapshot.propertySourceId,
        );

        if (!liveProperty) {
          throw new BadRequestException(
            `View property source ID "${viewPropertySnapshot.propertySourceId}" does not belong to database "${snapshot.sourceId}"`,
          );
        }

        view.addProperty({
          id: randomUUID(),
          propertyId: liveProperty.getId(),
          position: viewPropertySnapshot.position,
          visible: viewPropertySnapshot.visible,
          width: viewPropertySnapshot.width,
        });
      }

      return view;
    });

    return { database, rows, views };
  }

  private remapRowValue(
    value: RowValueData,
    property: ProvisionDatabasePropertySnapshot,
    optionSourceIdsByProperty: Map<string, Set<string>>,
    optionIdMap: Map<string, string>,
  ): RowValueData {
    if (value === null) {
      return null;
    }

    switch (property.type) {
      case PropertyType.SELECT:
      case PropertyType.STATUS:
        if (typeof value !== 'string') {
          throw new BadRequestException(
            `${property.type} property requires a source option ID`,
          );
        }

        return this.getLiveOptionId(
          property.sourceId,
          value,
          optionSourceIdsByProperty,
          optionIdMap,
        );

      case PropertyType.MULTI_SELECT:
        if (
          !Array.isArray(value) ||
          !value.every((item) => typeof item === 'string')
        ) {
          throw new BadRequestException(
            'MULTI_SELECT property requires source option IDs',
          );
        }

        return value.map((optionSourceId) =>
          this.getLiveOptionId(
            property.sourceId,
            optionSourceId,
            optionSourceIdsByProperty,
            optionIdMap,
          ),
        );

      default:
        return value;
    }
  }

  private getLiveOptionId(
    propertySourceId: string,
    optionSourceId: string,
    optionSourceIdsByProperty: Map<string, Set<string>>,
    optionIdMap: Map<string, string>,
  ): string {
    const propertyOptionSourceIds =
      optionSourceIdsByProperty.get(propertySourceId);
    const liveOptionId = optionIdMap.get(optionSourceId);

    if (!propertyOptionSourceIds?.has(optionSourceId) || !liveOptionId) {
      throw new BadRequestException(
        `Option source ID "${optionSourceId}" does not belong to property "${propertySourceId}"`,
      );
    }

    return liveOptionId;
  }

  private validateUniqueSourceIds(
    databases: ProvisionDatabaseSnapshot[],
  ): void {
    const databaseIds = new Set<string>();
    const propertyIds = new Set<string>();
    const optionIds = new Set<string>();
    const rowIds = new Set<string>();
    const viewIds = new Set<string>();

    for (const database of databases) {
      this.assertUniqueSourceId('database', database.sourceId, databaseIds);

      for (const property of database.properties) {
        this.assertUniqueSourceId('property', property.sourceId, propertyIds);

        for (const option of property.options) {
          this.assertUniqueSourceId('option', option.sourceId, optionIds);
        }
      }

      for (const row of database.rows) {
        this.assertUniqueSourceId('row', row.sourceId, rowIds);
      }

      for (const view of database.views) {
        this.assertUniqueSourceId('view', view.sourceId, viewIds);
      }
    }
  }

  private assertUniqueSourceId(
    type: string,
    sourceId: string,
    sourceIds: Set<string>,
  ): void {
    if (sourceIds.has(sourceId)) {
      throw new BadRequestException(`Duplicate ${type} source ID: ${sourceId}`);
    }

    sourceIds.add(sourceId);
  }

  private createEmptyResult(): DatabaseProvisioningResult {
    return {
      databaseIdMap: new Map<string, string>(),
      propertyIdMap: new Map<string, string>(),
      optionIdMap: new Map<string, string>(),
      rowIdMap: new Map<string, string>(),
      viewIdMap: new Map<string, string>(),
    };
  }

  private createLiveId(sourceId: string): string {
    let liveId = randomUUID();

    while (liveId === sourceId) {
      liveId = randomUUID();
    }

    return liveId;
  }
}
