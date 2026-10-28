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
  // Kế hoạch tích to-do: only the checkbox of an existing TODO changes.
  'SET_TODO_CHECKED',
  // Kế hoạch sửa chữ block: only the text of an existing block changes.
  'SET_BLOCK_TEXT',
  // Kế hoạch xoá block: soft-deletes one block and everything nested in it.
  'DELETE_BLOCK',
] as const;

/** SET_BLOCK_TEXT: the longest new text a block may get. */
export const AI_MODIFICATION_MAX_BLOCK_TEXT_LENGTH = 2000;

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
