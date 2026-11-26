import { PropertyType } from '../../../domain/enums/property-type.enum';
import {
  isValidEmail,
  isValidPhone,
  isValidUrl,
} from '../../../domain/value-objects/contact-value-format';
import {
  cleanCsvCell,
  isCsvCheckbox,
  isCsvDate,
  isCsvNumber,
} from './convert-csv-cell';

const MAX_SELECT_OPTIONS = 20;
const HTTP_SCHEME_PATTERN = /^https?:\/\//i;
const PHONE_PREFIX_PATTERN = /^(\+|0\d|\()/;

export function guessPropertyType(cells: readonly string[]): PropertyType {
  const values = cells.map(cleanCsvCell).filter(Boolean);
  if (values.length === 0) return PropertyType.TEXT;

  const all = (test: (value: string) => boolean) => values.every(test);
  if (
    all(isValidPhone) &&
    values.some((value) => PHONE_PREFIX_PATTERN.test(value))
  )
    return PropertyType.PHONE;
  if (all(isCsvNumber)) return PropertyType.NUMBER;
  if (all(isCsvCheckbox)) return PropertyType.CHECKBOX;
  if (all(isCsvDate)) return PropertyType.DATE;
  if (all((value) => HTTP_SCHEME_PATTERN.test(value) && isValidUrl(value)))
    return PropertyType.URL;
  if (all(isValidEmail)) return PropertyType.EMAIL;

  const distinct = new Set(values.map((value) => value.toLowerCase())).size;
  if (distinct <= MAX_SELECT_OPTIONS && distinct <= values.length / 2) {
    return PropertyType.SELECT;
  }

  return PropertyType.TEXT;
}
