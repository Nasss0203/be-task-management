import type { DatabaseProperty } from 'src/modules/database/domain/aggregates/database/database-property.entity';
import type { DatabaseRow } from 'src/modules/database/domain/aggregates/row/database-row.aggregate';
import type {
  DateRowValue,
  RowValueData,
} from 'src/modules/database/domain/aggregates/row/row-value.type';
import { PropertyType } from 'src/modules/database/domain/enums/property-type.enum';

const MAX_VALUE_LENGTH = 300;

const SKIPPED_TYPES = new Set<PropertyType>([
  PropertyType.TITLE,
  PropertyType.FILE,
  PropertyType.CREATED_TIME,
  PropertyType.UPDATED_TIME,
  PropertyType.CREATED_BY,
]);

const joinNonEmpty = (values: (string | undefined)[]) =>
  values.filter((value): value is string => Boolean(value)).join(', ') || null;

const optionNames = (property: DatabaseProperty, ids: readonly string[]) =>
  joinNonEmpty(
    ids.map((id) =>
      property
        .getOptions()
        .find((option) => option.getId() === id)
        ?.getName(),
    ),
  );

const isStringArray = (value: RowValueData): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'string');

const formatDate = (value: RowValueData) => {
  const date = value as DateRowValue | null;

  if (typeof date?.start !== 'string') {
    return null;
  }

  return date.end && date.end !== date.start
    ? `${date.start} → ${date.end}`
    : date.start;
};

const formatValue = (
  property: DatabaseProperty,
  value: RowValueData,
  peopleNames: ReadonlyMap<string, string>,
): string | null => {
  switch (property.getType()) {
    case PropertyType.SELECT:
    case PropertyType.STATUS:
      return typeof value === 'string' ? optionNames(property, [value]) : null;

    case PropertyType.MULTI_SELECT:
      return isStringArray(value) ? optionNames(property, value) : null;

    case PropertyType.PERSON:
      return isStringArray(value)
        ? joinNonEmpty(value.map((id) => peopleNames.get(id)))
        : null;

    case PropertyType.CHECKBOX:
      return typeof value === 'boolean' ? (value ? 'Yes' : 'No') : null;

    case PropertyType.DATE:
      return formatDate(value);

    default:
      return typeof value === 'string' || typeof value === 'number'
        ? String(value).trim() || null
        : null;
  }
};

const truncate = (text: string) =>
  text.length > MAX_VALUE_LENGTH
    ? `${text.slice(0, MAX_VALUE_LENGTH - 1)}…`
    : text;

export function buildEventDescription(input: {
  properties: readonly DatabaseProperty[];
  row: DatabaseRow;
  datePropertyId: string;
  peopleNames: ReadonlyMap<string, string>;
  rowUrl: string;
}): string {
  const values = new Map(
    input.row
      .getValues()
      .map((value) => [value.getPropertyId(), value.getValue()]),
  );

  const lines = [...input.properties]
    .filter(
      (property) =>
        !SKIPPED_TYPES.has(property.getType()) &&
        property.getId() !== input.datePropertyId,
    )
    .sort((a, b) => Number(a.getPosition()) - Number(b.getPosition()))
    .flatMap((property) => {
      const text = formatValue(
        property,
        values.get(property.getId()) ?? null,
        input.peopleNames,
      );

      return text ? [`${property.getName()}: ${truncate(text)}`] : [];
    });

  return [
    ...lines,
    ...(lines.length ? [''] : []),
    `Open in Taskmanly: ${input.rowUrl}`,
  ].join('\n');
}
