import { PropertyType } from '../enums/property-type.enum';

export const MAX_DATABASE_VIEW_FILTERS = 10;

export interface DatabaseViewFilter {
  propertyId: string;
  operator: string;
  value?: string | number | null;
}

const TEXT = ['contains', 'not_contains', 'equals', 'is_empty', 'is_not_empty'];
const EMPTY = ['is_empty', 'is_not_empty'];

export const FILTER_OPERATORS: Partial<
  Record<PropertyType, readonly string[]>
> = {
  [PropertyType.TITLE]: TEXT,
  [PropertyType.TEXT]: TEXT,
  [PropertyType.URL]: TEXT,
  [PropertyType.EMAIL]: TEXT,
  [PropertyType.PHONE]: TEXT,
  [PropertyType.NUMBER]: ['eq', 'neq', 'gt', 'gte', 'lt', 'lte', ...EMPTY],
  [PropertyType.SELECT]: ['is', 'is_not', ...EMPTY],
  [PropertyType.STATUS]: ['is', 'is_not', ...EMPTY],
  [PropertyType.MULTI_SELECT]: ['contains', 'not_contains', ...EMPTY],
  [PropertyType.DATE]: ['before', 'after', 'on', ...EMPTY],
  [PropertyType.CHECKBOX]: ['is_checked', 'is_unchecked'],
};

export const VALUELESS_OPERATORS = new Set([
  'is_empty',
  'is_not_empty',
  'is_checked',
  'is_unchecked',
]);
