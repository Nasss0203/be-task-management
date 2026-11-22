import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';

import type { PersistenceContext } from 'src/shared/domain/persistence-context';
import { PERSISTENCE_TYPES } from 'src/shared/infrastructure/persistence/persistence.types';
import type { UnitOfWork } from 'src/shared/infrastructure/persistence/unit-of-work.interface';
import { DATABASE_TYPES } from '../../../database.types';
import { DEFAULT_STATUS_OPTIONS } from '../../../domain/constants/default-property-options.constant';
import { DatabaseProperty } from '../../../domain/aggregates/database/database-property.entity';
import type { Database } from '../../../domain/aggregates/database/database.aggregate';
import { PropertyOption } from '../../../domain/aggregates/database/property-option.entity';
import { DatabaseRow } from '../../../domain/aggregates/row/database-row.aggregate';
import { RowValue } from '../../../domain/aggregates/row/row-value.entity';
import type { RowValueData } from '../../../domain/aggregates/row/row-value.type';
import { PropertyType } from '../../../domain/enums/property-type.enum';
import type { DatabaseRepository } from '../../../domain/repositories/database.repository';
import type { DatabaseRowRepository } from '../../../domain/repositories/database-row.repository';
import type { DatabaseActivityRecorder } from '../../ports/database-activity-recorder.port';
import type { DatabasePeopleReader } from '../../ports/database-people-reader.port';
import type { DatabaseRowChangePublisher } from '../../ports/database-row-change-publisher.port';
import { AddPropertyCommand } from '../add-property/add-property.command';
import { AddPropertyHandler } from '../add-property/add-property.handler';
import {
  convertCsvCell,
  CREATABLE_PROPERTY_TYPES,
  UNMAPPABLE_PROPERTY_TYPES,
  type ImportPerson,
  type ResolvedOption,
} from './convert-csv-cell';
import { guessPropertyType } from './guess-property-type';
import { pickOptionColors } from './pick-option-colors';
import {
  ImportDatabaseRowsCommand,
  type ImportColumnMapping,
} from './import-database-rows.command';
import type {
  ImportCsvError,
  ImportDatabaseRowsResult,
} from './import-database-rows.result';
import { readCsvRecords, type CsvRecords } from './read-csv-records';

const PREVIEW_ROWS = 5;
const MAX_REPORTED_ERRORS = 100;
const MAX_NEW_PROPERTIES = 20;
const MAX_PROPERTY_NAME_LENGTH = 250;

interface PlannedProperty {
  column: number;
  name: string;
  type: PropertyType;
  property: DatabaseProperty;
}

interface ColumnPlan {
  columns: (DatabaseProperty | null)[];
  newProperties: PlannedProperty[];
}

interface PendingOption {
  property: DatabaseProperty;
  option: ResolvedOption;
  color: string | null;
}

interface ConvertedRow {
  values: { property: DatabaseProperty; value: RowValueData }[];
  newOptionIds: string[];
}

const normalizeName = (name: string) => name.trim().toLowerCase();

const isMappable = (property: DatabaseProperty) =>
  !UNMAPPABLE_PROPERTY_TYPES.includes(property.getType());

function applyDomainChange(change: () => void): void {
  try {
    change();
  } catch (error) {
    if (error instanceof Error) {
      throw new BadRequestException(error.message);
    }
    throw error;
  }
}

@Injectable()
export class ImportDatabaseRowsHandler {
  constructor(
    @Inject(DATABASE_TYPES.repositories.DatabaseRepository)
    private readonly databaseRepository: DatabaseRepository,
    @Inject(DATABASE_TYPES.repositories.DatabaseRowRepository)
    private readonly databaseRowRepository: DatabaseRowRepository,
    @Inject(DATABASE_TYPES.ports.DatabasePeopleReader)
    private readonly peopleReader: DatabasePeopleReader,
    @Inject(DATABASE_TYPES.ports.DatabaseActivityRecorder)
    private readonly activityRecorder: DatabaseActivityRecorder,
    @Inject(DATABASE_TYPES.ports.DatabaseRowChangePublisher)
    private readonly rowChangePublisher: DatabaseRowChangePublisher,
    @Inject(PERSISTENCE_TYPES.UnitOfWork)
    private readonly uow: UnitOfWork,
    private readonly addPropertyHandler: AddPropertyHandler,
  ) {}

  async execute(
    command: ImportDatabaseRowsCommand,
  ): Promise<ImportDatabaseRowsResult> {
    const records = readCsvRecords(command.file);

    if (command.dryRun) {
      return this.run(command, records);
    }

    const result = await this.uow.runInTransaction((context) =>
      this.run(command, records, context),
    );
    if (result.createdRows > 0) {
      this.rowChangePublisher.publish(command.databaseId);
    }

    return result;
  }

  private async run(
    command: ImportDatabaseRowsCommand,
    records: CsvRecords,
    context?: PersistenceContext,
  ): Promise<ImportDatabaseRowsResult> {
    let database = await this.databaseRepository.findById(
      command.databaseId,
      context,
    );
    if (!database) {
      throw new NotFoundException('Database not found');
    }

    const matched = this.matchColumns(records.headers, database);
    const suggestedTypes = matched.map((propertyId, index) =>
      propertyId === null
        ? guessPropertyType(records.rows.map((cells) => cells[index] ?? ''))
        : null,
    );
    const mapping =
      command.mapping ?? this.suggestMapping(matched, suggestedTypes);
    const plan = this.planColumns(mapping, records.headers, database);

    let columns = plan.columns;
    if (!command.dryRun && plan.newProperties.length > 0) {
      ({ database, columns } = await this.createProperties(
        command,
        mapping,
        plan.newProperties,
        context,
      ));
    }

    const people = columns.some(
      (property) => property?.getType() === PropertyType.PERSON,
    )
      ? await this.loadPeople(database.getId())
      : [];
    const pendingOptions = new Map<string, PendingOption>();
    const resolveOption = this.createOptionResolver(pendingOptions);

    const errors: ImportCsvError[] = [];
    const preview: string[][] = [];
    const validRows: ConvertedRow[] = [];

    records.rows.forEach((cells, rowIndex) => {
      const converted: ConvertedRow = { values: [], newOptionIds: [] };
      const display = records.headers.map(() => '');
      let hasError = false;

      columns.forEach((property, columnIndex) => {
        if (!property) return;
        const raw = cells[columnIndex] ?? '';
        const result = convertCsvCell(property, raw, {
          timeZone: command.timeZone,
          people,
          resolveOption,
        });
        if (!result) return;

        if (!result.ok) {
          hasError = true;
          display[columnIndex] = raw.trim();
          errors.push({
            row: rowIndex + 1,
            column: records.headers[columnIndex],
            message: result.message,
          });
          return;
        }

        display[columnIndex] = result.display;
        converted.values.push({ property, value: result.value });
        converted.newOptionIds.push(...result.newOptionIds);
      });

      if (rowIndex < PREVIEW_ROWS) preview.push(display);
      if (!hasError && converted.values.length > 0) validRows.push(converted);
    });

    this.assignOptionColors(pendingOptions);
    const usedOptionIds = new Set(validRows.flatMap((row) => row.newOptionIds));
    const newOptions = [...pendingOptions.values()].filter(({ option }) =>
      usedOptionIds.has(option.id),
    );

    if (!command.dryRun) {
      await this.save(command, database, newOptions, validRows, context);
    }

    return {
      headers: records.headers,
      mapping,
      suggestedTypes,
      totalRows: records.rows.length,
      validRows: validRows.length,
      skippedRows: records.rows.length - validRows.length,
      createdRows: command.dryRun ? 0 : validRows.length,
      preview,
      newProperties: plan.newProperties.map(({ column, name, type }) => ({
        column,
        propertyId: columns[column]!.getId(),
        name,
        type,
      })),
      newOptions: newOptions.map(({ property, option, color }) => ({
        propertyId: property.getId(),
        name: option.name,
        color,
      })),
      errors: errors.slice(0, MAX_REPORTED_ERRORS),
    };
  }

  private matchColumns(
    headers: string[],
    database: Database,
  ): (string | null)[] {
    const used = new Set<string>();
    const mapping = headers.map((header) => {
      const property = database
        .getProperties()
        .find(
          (item) =>
            isMappable(item) &&
            !used.has(item.getId()) &&
            normalizeName(item.getName()) === normalizeName(header),
        );
      if (!property) return null;
      used.add(property.getId());
      return property.getId();
    });

    const title = database
      .getProperties()
      .find((item) => item.getType() === PropertyType.TITLE);
    if (title && !used.has(title.getId()) && mapping[0] === null) {
      mapping[0] = title.getId();
    }

    return mapping;
  }

  private suggestMapping(
    matched: (string | null)[],
    suggestedTypes: (PropertyType | null)[],
  ): ImportColumnMapping[] {
    let newProperties = 0;
    return matched.map((propertyId, index) => {
      const type = suggestedTypes[index];
      if (propertyId !== null || type === null) return propertyId;
      if (newProperties >= MAX_NEW_PROPERTIES) return null;
      newProperties++;
      return { type };
    });
  }

  private planColumns(
    mapping: ImportColumnMapping[],
    headers: string[],
    database: Database,
  ): ColumnPlan {
    if (mapping.length !== headers.length) {
      throw new BadRequestException(
        'The mapping must have one entry per CSV column',
      );
    }

    const usedIds = new Set<string>();
    const usedNames = new Set(
      database
        .getProperties()
        .map((property) => normalizeName(property.getName())),
    );
    const newProperties: PlannedProperty[] = [];

    const columns = mapping.map((entry, index) => {
      if (entry === null) return null;

      if (typeof entry !== 'string') {
        if (!CREATABLE_PROPERTY_TYPES.includes(entry.type)) {
          throw new BadRequestException(
            `${entry.type} properties cannot be created by an import`,
          );
        }
        const name = this.uniqueName(headers[index], index, usedNames);
        const property = this.buildProperty(database, name, entry.type);
        newProperties.push({ column: index, name, type: entry.type, property });
        return property;
      }

      const property = database
        .getProperties()
        .find((item) => item.getId() === entry);
      if (!property) {
        throw new BadRequestException('Mapped property does not exist');
      }
      if (!isMappable(property)) {
        throw new BadRequestException(
          `${property.getType()} properties cannot be imported`,
        );
      }
      if (usedIds.has(entry)) {
        throw new BadRequestException(
          'A property can be mapped to only one column',
        );
      }

      usedIds.add(entry);
      return property;
    });

    if (newProperties.length > MAX_NEW_PROPERTIES) {
      throw new BadRequestException(
        `An import can create at most ${MAX_NEW_PROPERTIES} properties`,
      );
    }

    return { columns, newProperties };
  }

  private uniqueName(
    header: string,
    index: number,
    usedNames: Set<string>,
  ): string {
    const base =
      header.trim().slice(0, MAX_PROPERTY_NAME_LENGTH) || `Column ${index + 1}`;
    let name = base;
    for (let suffix = 2; usedNames.has(normalizeName(name)); suffix++) {
      name = `${base} ${suffix}`;
    }
    usedNames.add(normalizeName(name));
    return name;
  }

  private buildProperty(
    database: Database,
    name: string,
    type: PropertyType,
  ): DatabaseProperty {
    const property = new DatabaseProperty(
      randomUUID(),
      database.getId(),
      name,
      type,
      false,
      true,
      String(database.getProperties().length),
    );
    if (type === PropertyType.STATUS) {
      DEFAULT_STATUS_OPTIONS.forEach((option, index) =>
        property.addOption(
          new PropertyOption(
            randomUUID(),
            option.name,
            option.color,
            String(index),
          ),
        ),
      );
    }
    return property;
  }

  private async createProperties(
    command: ImportDatabaseRowsCommand,
    mapping: ImportColumnMapping[],
    planned: PlannedProperty[],
    context?: PersistenceContext,
  ): Promise<{ database: Database; columns: (DatabaseProperty | null)[] }> {
    const createdIds = new Map<number, string>();
    for (const { column, name, type } of planned) {
      const created = await this.addPropertyHandler.execute(
        new AddPropertyCommand(command.databaseId, name, type, command.actorId),
        context,
      );
      createdIds.set(column, created.id);
    }

    const database = await this.databaseRepository.findById(
      command.databaseId,
      context,
    );
    if (!database) {
      throw new NotFoundException('Database not found');
    }

    const columns = mapping.map((entry, index) => {
      if (entry === null) return null;
      const propertyId =
        typeof entry === 'string' ? entry : createdIds.get(index);
      return (
        database.getProperties().find((item) => item.getId() === propertyId) ??
        null
      );
    });

    return { database, columns };
  }

  private async loadPeople(databaseId: string): Promise<ImportPerson[]> {
    const members = await this.peopleReader.findWorkspaceMembers(databaseId);

    return members.map((member) => ({
      userId: member.user_id,
      displayName: member.full_name || member.username,
      names: [
        ...new Set(
          [member.email, member.username, member.full_name]
            .filter((name): name is string => Boolean(name))
            .map(normalizeName),
        ),
      ],
    }));
  }

  private createOptionResolver(pendingOptions: Map<string, PendingOption>) {
    return (property: DatabaseProperty, name: string): ResolvedOption => {
      const existing = property
        .getOptions()
        .find(
          (option) => normalizeName(option.getName()) === normalizeName(name),
        );
      if (existing) {
        return { id: existing.getId(), name: existing.getName(), isNew: false };
      }

      const key = `${property.getId()}:${normalizeName(name)}`;
      const pending = pendingOptions.get(key) ?? {
        property,
        option: { id: randomUUID(), name: name.trim(), isNew: true },
        color: null,
      };
      pendingOptions.set(key, pending);
      return pending.option;
    };
  }

  private assignOptionColors(pendingOptions: Map<string, PendingOption>) {
    const byProperty = new Map<DatabaseProperty, PendingOption[]>();
    for (const pending of pendingOptions.values()) {
      byProperty.set(pending.property, [
        ...(byProperty.get(pending.property) ?? []),
        pending,
      ]);
    }

    for (const [property, pendings] of byProperty) {
      const colors = pickOptionColors(
        property.getOptions().map((option) => option.getColor()),
        pendings.map(({ option }) => option.name),
      );
      pendings.forEach((pending, index) => {
        pending.color = colors[index];
      });
    }
  }

  private async save(
    command: ImportDatabaseRowsCommand,
    database: Database,
    newOptions: PendingOption[],
    rows: ConvertedRow[],
    context?: PersistenceContext,
  ): Promise<void> {
    for (const { property, option, color } of newOptions) {
      applyDomainChange(() =>
        property.addOption(
          new PropertyOption(
            option.id,
            option.name,
            color,
            String(property.getOptions().length),
          ),
        ),
      );
    }
    if (newOptions.length > 0) {
      await this.databaseRepository.save(database, context);
    }
    for (const { property, option } of newOptions) {
      await this.activityRecorder.record(
        {
          actorId: command.actorId,
          databaseId: database.getId(),
          action: 'DATABASE_PROPERTY_UPDATED',
          propertyId: property.getId(),
          optionId: option.id,
          kind: 'OPTION_ADDED',
        },
        context,
      );
    }

    const statusProperties = database
      .getProperties()
      .filter((property) => property.getType() === PropertyType.STATUS);
    let position =
      (await this.databaseRowRepository.findMaxPosition(
        database.getId(),
        context,
      )) ?? 0;

    for (const converted of rows) {
      position += 1;
      const row = DatabaseRow.create({
        id: randomUUID(),
        databaseId: database.getId(),
        position,
        parentRowId: null,
      });
      const values = [...converted.values];

      for (const status of statusProperties) {
        const defaultOption = status.getDefaultOption();
        if (
          defaultOption &&
          !values.some(({ property }) => property.getId() === status.getId())
        ) {
          values.push({ property: status, value: defaultOption.getId() });
        }
      }

      for (const { property, value } of values) {
        applyDomainChange(() =>
          row.setValue(
            property,
            new RowValue(randomUUID(), row.getId(), property.getId(), value),
          ),
        );
      }

      await this.databaseRowRepository.save(row, context);
      await this.activityRecorder.record(
        {
          actorId: command.actorId,
          databaseId: database.getId(),
          action: 'DATABASE_ROW_CREATED',
          rowId: row.getId(),
        },
        context,
      );
    }
  }
}
