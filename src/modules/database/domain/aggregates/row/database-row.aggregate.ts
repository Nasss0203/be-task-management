import { PropertyType } from '../../enums/property-type.enum';
import { DatabaseProperty } from '../database/database-property.entity';

import { RowValue } from './row-value.entity';
import { DateRowValue, RowValueData } from './row-value.type';

interface CreateDatabaseRowParams {
  id: string;
  databaseId: string;
}

interface RestoreDatabaseRowParams {
  id: string;
  databaseId: string;
  values: RowValue[];
}

export class DatabaseRow {
  private values: RowValue[];

  private constructor(
    readonly id: string,
    readonly databaseId: string,
    values: RowValue[],
  ) {
    this.values = [...values];
  }

  static create(params: CreateDatabaseRowParams): DatabaseRow {
    return new DatabaseRow(params.id, params.databaseId, []);
  }

  static restore(params: RestoreDatabaseRowParams): DatabaseRow {
    return new DatabaseRow(params.id, params.databaseId, params.values);
  }

  getId(): string {
    return this.id;
  }

  getDatabaseId(): string {
    return this.databaseId;
  }

  getValues(): readonly RowValue[] {
    return [...this.values];
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
      typeof (value as DateRowValue).start !== 'string'
    ) {
      throw new Error('DATE property requires a date value');
    }
  }
}
