import { PropertyType } from '../../enums/property-type.enum';
import { DatabaseProperty } from '../database/database-property.entity';

import { DATE_TIME_KEY, isTimeZone } from './date-row-value';
import { RowValue } from './row-value.entity';
import { RowValueData } from './row-value.type';

interface CreateDatabaseRowParams {
  id: string;
  databaseId: string;
  position?: number;
  parentRowId?: string | null;
}

interface RestoreDatabaseRowParams {
  id: string;
  databaseId: string;
  values: RowValue[];
  position?: number;
  parentRowId?: string | null;
}

export class DatabaseRow {
  private values: RowValue[];

  private constructor(
    readonly id: string,
    readonly databaseId: string,
    values: RowValue[],
    private position: number,
    private parentRowId: string | null,
  ) {
    this.values = [...values];
  }

  static create(params: CreateDatabaseRowParams): DatabaseRow {
    return new DatabaseRow(
      params.id,
      params.databaseId,
      [],
      params.position ?? 0,
      params.parentRowId ?? null,
    );
  }

  static restore(params: RestoreDatabaseRowParams): DatabaseRow {
    return new DatabaseRow(
      params.id,
      params.databaseId,
      params.values,
      params.position ?? 0,
      params.parentRowId ?? null,
    );
  }

  getId(): string {
    return this.id;
  }

  getPosition(): number {
    return this.position;
  }

  moveTo(position: number): void {
    if (!Number.isFinite(position)) {
      throw new Error('Row position must be a finite number');
    }

    this.position = position;
  }

  getDatabaseId(): string {
    return this.databaseId;
  }

  getValues(): readonly RowValue[] {
    return [...this.values];
  }

  getParentRowId(): string | null {
    return this.parentRowId;
  }

  setValue(property: DatabaseProperty, rowValue: RowValue): RowValue {
    if (property.getDatabaseId() !== this.databaseId) {
      throw new Error('Property does not belong to this database');
    }

    if (rowValue.getRowId() !== this.id) {
      throw new Error('Row value does not belong to this row');
    }

    if (rowValue.getPropertyId() !== property.getId()) {
      throw new Error('Row value does not belong to this property');
    }

    this.validateValue(property, rowValue.getValue());

    const existing = this.values.find(
      (value) => value.getPropertyId() === property.getId(),
    );

    if (existing) {
      existing.changeValue(rowValue.getValue());

      return existing;
    }

    this.values.push(rowValue);

    return rowValue;
  }

  changeParent(parentRowId: string | null): void {
    if (parentRowId === this.id) {
      throw new Error('A row cannot be its own parent');
    }

    this.parentRowId = parentRowId;
  }

  private validateValue(property: DatabaseProperty, value: RowValueData): void {
    if (value === null) {
      return;
    }

    switch (property.getType()) {
      case PropertyType.TITLE:
      case PropertyType.TEXT:
      case PropertyType.URL:
      case PropertyType.EMAIL:
      case PropertyType.PHONE:
        if (typeof value !== 'string') {
          throw new Error(
            `Property type ${property.getType()} requires a string value`,
          );
        }
        return;

      case PropertyType.NUMBER:
        if (typeof value !== 'number') {
          throw new Error('NUMBER property requires a number value');
        }
        return;

      case PropertyType.CHECKBOX:
        if (typeof value !== 'boolean') {
          throw new Error('CHECKBOX property requires a boolean value');
        }
        return;

      case PropertyType.SELECT:
      case PropertyType.STATUS:
        this.validateSingleOption(property, value);
        return;

      case PropertyType.MULTI_SELECT:
        this.validateMultipleOptions(property, value);
        return;

      case PropertyType.DATE:
        this.validateDate(value);
        return;

      case PropertyType.PERSON:
      case PropertyType.FILE:
        if (
          !Array.isArray(value) ||
          !value.every((item) => typeof item === 'string')
        ) {
          throw new Error(
            `${property.getType()} property requires an array of ids`,
          );
        }
        return;

      case PropertyType.CREATED_TIME:
      case PropertyType.UPDATED_TIME:
      case PropertyType.CREATED_BY:
        throw new Error(`${property.getType()} is read only`);

      default:
        throw new Error(`Unsupported property type ${property.getType()}`);
    }
  }

  private validateSingleOption(
    property: DatabaseProperty,
    value: RowValueData,
  ): void {
    if (typeof value !== 'string') {
      throw new Error(`${property.getType()} requires an option id`);
    }

    const optionExists = property
      .getOptions()
      .some((option) => option.getId() === value);

    if (!optionExists) {
      throw new Error('Property option does not exist');
    }
  }

  private validateMultipleOptions(
    property: DatabaseProperty,
    value: RowValueData,
  ): void {
    if (
      !Array.isArray(value) ||
      !value.every((item) => typeof item === 'string')
    ) {
      throw new Error('MULTI_SELECT requires an array of option ids');
    }

    const validOptionIds = new Set(
      property.getOptions().map((option) => option.getId()),
    );

    const invalidOption = value.some(
      (optionId) => !validOptionIds.has(optionId),
    );

    if (invalidOption) {
      throw new Error('Property option does not exist');
    }
  }

  private validateDate(value: RowValueData): void {
    if (
      typeof value !== 'object' ||
      value === null ||
      Array.isArray(value) ||
      !('start' in value) ||
      typeof value.start !== 'string'
    ) {
      throw new Error('DATE property requires a date value');
    }

    if (!DATE_TIME_KEY.test(value.start)) {
      return;
    }

    if (!isTimeZone(value.timeZone)) {
      throw new Error('DATE property with a time requires a valid time zone');
    }

    if (
      value.end !== undefined &&
      value.end !== null &&
      (!DATE_TIME_KEY.test(value.end) || value.end <= value.start)
    ) {
      throw new Error('DATE property end time must be after its start time');
    }
  }
}
