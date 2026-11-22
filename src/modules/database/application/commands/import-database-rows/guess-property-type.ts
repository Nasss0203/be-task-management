import { PropertyType } from '../../../domain/enums/property-type.enum';
import {
  cleanCsvCell,
  isCsvCheckbox,
  isCsvDate,
  isCsvNumber,
} from './convert-csv-cell';

const MAX_SELECT_OPTIONS = 20;
const URL_PATTERN = /^https?:\/\/\S+$/i;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function guessPropertyType(cells: readonly string[]): PropertyType {
  const values = cells.map(cleanCsvCell).filter(Boolean);
  if (values.length === 0) return PropertyType.TEXT;

  const all = (test: (value: string) => boolean) => values.every(test);
  if (all(isCsvNumber)) return PropertyType.NUMBER;
  if (all(isCsvCheckbox)) return PropertyType.CHECKBOX;
  if (all(isCsvDate)) return PropertyType.DATE;
  if (all((value) => URL_PATTERN.test(value))) return PropertyType.URL;
  if (all((value) => EMAIL_PATTERN.test(value))) return PropertyType.EMAIL;

  const distinct = new Set(values.map((value) => value.toLowerCase())).size;
  if (distinct <= MAX_SELECT_OPTIONS && distinct <= values.length / 2) {
    return PropertyType.SELECT;
  }

  return PropertyType.TEXT;
}
