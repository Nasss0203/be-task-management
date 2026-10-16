import { PropertyType } from 'src/modules/database/domain/enums/property-type.enum';
import { PageBlockType } from 'src/shared/domain/page-block-type.enum';

export const AI_MODIFICATION_PLAN_CAPABILITY =
  'GENERATE_PAGE_MODIFICATION_PLAN' as const;

export const AI_MODIFICATION_PLAN_SCHEMA_VERSION = 1 as const;

export const AI_MODIFICATION_PLAN_TYPE = 'AI_MODIFICATION_PLAN' as const;

export const AI_MODIFICATION_PLAN_STATUSES = [
  'PLAN_READY',
  'NEED_MORE_CONTEXT',
] as const;

export const AI_MODIFICATION_OPERATION_TYPES = [
  'CREATE_DATABASE_ROWS',
  'INSERT_BLOCKS',
] as const;

export const AI_MODIFICATION_SUPPORTED_BLOCK_TYPES = [
  PageBlockType.TEXT,
  PageBlockType.HEADER,
  PageBlockType.QUOTE,
  PageBlockType.TODO,
  PageBlockType.TOGGLE,
] as const;

export const AI_MODIFICATION_SUPPORTED_PROPERTY_TYPES = [
  PropertyType.TITLE,
  PropertyType.TEXT,
  PropertyType.NUMBER,
  PropertyType.SELECT,
  PropertyType.STATUS,
  PropertyType.MULTI_SELECT,
  PropertyType.CHECKBOX,
  PropertyType.DATE,
  PropertyType.URL,
  PropertyType.EMAIL,
  PropertyType.PHONE,
] as const;

export const AI_MODIFICATION_CONTEXT_REQUEST_REASONS = [
  'ROWS_TRUNCATED',
  'TEXT_TRUNCATED',
  'AMBIGUOUS_TARGET',
  'MISSING_RESOURCE_CONTEXT',
] as const;
