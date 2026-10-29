import { DatabaseRow } from '../../domain/aggregates/row/database-row.aggregate';
import { RowValueData } from '../../domain/aggregates/row/row-value.type';

export class DatabaseRowValueDto {
  id: string;
  propertyId: string;
  value: RowValueData;
}

export class DatabaseRowDto {
  id: string;
  databaseId: string;
  position: number;
  parentRowId: string | null;
  values: DatabaseRowValueDto[];

  static fromDomain(row: DatabaseRow): DatabaseRowDto {
    return {
      id: row.getId(),
      databaseId: row.getDatabaseId(),
      position: row.getPosition(),
      parentRowId: row.getParentRowId(),
      values: row.getValues().map((value) => ({
        id: value.getId(),
        propertyId: value.getPropertyId(),
        value: value.getValue(),
      })),
    };
  }
}
