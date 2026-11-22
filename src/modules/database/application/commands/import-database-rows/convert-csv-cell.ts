import type { DatabaseProperty } from '../../../domain/aggregates/database/database-property.entity';
import { isTimeZone } from '../../../domain/aggregates/row/date-row-value';
import type {
  DateRowValue,
  RowValueData,
} from '../../../domain/aggregates/row/row-value.type';
import { PropertyType } from '../../../domain/enums/property-type.enum';

export interface ImportPerson {
  userId: string;
  names: string[];
  displayName: string;
}

export interface CsvCellContext {
  timeZone: string | null;
  people: readonly ImportPerson[];
  resolveOption: (property: DatabaseProperty, name: string) => ResolvedOption;
}

export interface ResolvedOption {
  id: string;
  name: string;
  isNew: boolean;
}

export type CsvCellResult =
  | { ok: true; value: RowValueData; display: string; newOptionIds: string[] }
  | { ok: false; message: string };

export const UNMAPPABLE_PROPERTY_TYPES: readonly PropertyType[] = [
  PropertyType.FILE,
  PropertyType.CREATED_TIME,
  PropertyType.UPDATED_TIME,
  PropertyType.CREATED_BY,
];

export const CREATABLE_PROPERTY_TYPES: readonly PropertyType[] = [
  PropertyType.TEXT,
  PropertyType.NUMBER,
  PropertyType.SELECT,
  PropertyType.MULTI_SELECT,
  PropertyType.STATUS,
  PropertyType.DATE,
  PropertyType.CHECKBOX,
  PropertyType.PERSON,
  PropertyType.URL,
  PropertyType.EMAIL,
  PropertyType.PHONE,
];

const FORMULA_GUARD = /^'(?=[=+\-@\t\r])/;
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})(?: (\d{2}):(\d{2}))?$/;
const VN_DATE = /^(\d{2})\/(\d{2})\/(\d{4})(?: (\d{2}):(\d{2}))?$/;
const TRUE_WORDS = new Set(['true', '1', 'yes', 'x']);
const FALSE_WORDS = new Set(['false', '0', 'no']);

const success = (
  value: RowValueData,
  display: string,
  newOptionIds: string[] = [],
): CsvCellResult => ({ ok: true, value, display, newOptionIds });

const failure = (message: string): CsvCellResult => ({ ok: false, message });

function splitList(text: string): string[] {
  return [
    ...new Set(
      text
        .split(',')
        .map((part) => part.trim())
        .filter(Boolean),
    ),
  ];
}

interface ParsedDate {
  key: string;
  hasTime: boolean;
}

function parseDate(text: string): ParsedDate | null {
  const iso = ISO_DATE.exec(text);
  const vn = VN_DATE.exec(text);
  const parts = iso
    ? [iso[1], iso[2], iso[3], iso[4], iso[5]]
    : vn
      ? [vn[3], vn[2], vn[1], vn[4], vn[5]]
      : null;
  if (!parts) return null;

  const [year, month, day, hour, minute] = parts;
  const date = new Date(Date.UTC(+year, +month - 1, +day));
  if (
    date.getUTCFullYear() !== +year ||
    date.getUTCMonth() !== +month - 1 ||
    date.getUTCDate() !== +day
  ) {
    return null;
  }

  const dateKey = `${year}-${month}-${day}`;
  if (hour === undefined) return { key: dateKey, hasTime: false };
  if (+hour > 23 || +minute > 59) return null;

  return { key: `${dateKey}T${hour}:${minute}`, hasTime: true };
}

function convertDate(text: string, timeZone: string | null): CsvCellResult {
  const [startText, endText, ...rest] = text
    .split('→')
    .map((part) => part.trim());
  const start = parseDate(startText);
  const end = endText === undefined ? null : parseDate(endText);

  if (!start || rest.length > 0 || (endText !== undefined && !end)) {
    return failure('Invalid date, use YYYY-MM-DD or DD/MM/YYYY');
  }
  if (end && end.hasTime !== start.hasTime) {
    return failure('Start and end dates must both have a time or neither');
  }
  if (end && (start.hasTime ? end.key <= start.key : end.key < start.key)) {
    return failure('End date must be after the start date');
  }
  if (start.hasTime && !isTimeZone(timeZone)) {
    return failure('A time zone is required for dates with a time');
  }

  const value: DateRowValue = {
    start: start.key,
    end: end?.key ?? null,
    timeZone: start.hasTime ? timeZone : null,
  };
  const display = [start.key, end?.key]
    .filter(Boolean)
    .map((key) => key!.replace('T', ' '))
    .join(' → ');

  return success(value, display);
}

function convertPeople(
  text: string,
  people: readonly ImportPerson[],
): CsvCellResult {
  const ids: string[] = [];
  const names: string[] = [];

  for (const name of splitList(text)) {
    const lowered = name.toLowerCase();
    const matches = people.filter((person) => person.names.includes(lowered));
    if (matches.length === 0)
      return failure(`No workspace member named "${name}"`);
    if (matches.length > 1)
      return failure(`More than one workspace member matches "${name}"`);
    if (!ids.includes(matches[0].userId)) {
      ids.push(matches[0].userId);
      names.push(matches[0].displayName);
    }
  }

  return success(ids, names.join(', '));
}

export const cleanCsvCell = (rawText: string) =>
  rawText.trim().replace(FORMULA_GUARD, '');

export const isCsvNumber = (text: string) =>
  Number.isFinite(Number(text.replace(/\s/g, '')));

export const isCsvCheckbox = (text: string) =>
  TRUE_WORDS.has(text.toLowerCase()) || FALSE_WORDS.has(text.toLowerCase());

export const isCsvDate = (text: string) => convertDate(text, 'UTC').ok;

export function convertCsvCell(
  property: DatabaseProperty,
  rawText: string,
  context: CsvCellContext,
): CsvCellResult | null {
  const text = cleanCsvCell(rawText);
  if (!text) return null;

  switch (property.getType()) {
    case PropertyType.TITLE:
    case PropertyType.TEXT:
    case PropertyType.URL:
    case PropertyType.EMAIL:
    case PropertyType.PHONE:
      return success(text, text);

    case PropertyType.NUMBER: {
      const number = Number(text.replace(/\s/g, ''));
      return Number.isFinite(number)
        ? success(number, String(number))
        : failure('Not a number');
    }

    case PropertyType.CHECKBOX: {
      const lowered = text.toLowerCase();
      if (TRUE_WORDS.has(lowered)) return success(true, 'TRUE');
      if (FALSE_WORDS.has(lowered)) return success(false, 'FALSE');
      return failure('Use TRUE or FALSE');
    }

    case PropertyType.SELECT:
    case PropertyType.STATUS: {
      const option = context.resolveOption(property, text);
      return success(option.id, option.name, option.isNew ? [option.id] : []);
    }

    case PropertyType.MULTI_SELECT: {
      const options = splitList(text).map((name) =>
        context.resolveOption(property, name),
      );
      return success(
        [...new Set(options.map((option) => option.id))],
        options.map((option) => option.name).join(', '),
        options.filter((option) => option.isNew).map((option) => option.id),
      );
    }

    case PropertyType.DATE:
      return convertDate(text, context.timeZone);

    case PropertyType.PERSON:
      return convertPeople(text, context.people);

    default:
      return failure(`${property.getType()} columns cannot be imported`);
  }
}
