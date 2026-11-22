import type { PropertyType } from '../../../domain/enums/property-type.enum';
import type { ImportColumnMapping } from './import-database-rows.command';

export interface ImportCsvError {
  row: number;
  column: string;
  message: string;
}

export interface ImportCsvNewOption {
  propertyId: string;
  name: string;
  color: string | null;
}

export interface ImportCsvNewProperty {
  column: number;
  propertyId: string;
  name: string;
  type: PropertyType;
}

export interface ImportDatabaseRowsResult {
  headers: string[];
  mapping: ImportColumnMapping[];
  suggestedTypes: (PropertyType | null)[];
  totalRows: number;
  validRows: number;
  skippedRows: number;
  createdRows: number;
  preview: string[][];
  newProperties: ImportCsvNewProperty[];
  newOptions: ImportCsvNewOption[];
  errors: ImportCsvError[];
}
