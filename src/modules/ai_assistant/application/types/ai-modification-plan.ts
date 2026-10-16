import { type RowValueData } from 'src/modules/database/domain/aggregates/row/row-value.type';

import { PageBlockType } from 'src/shared/domain/page-block-type.enum';
import {
  AI_MODIFICATION_CONTEXT_REQUEST_REASONS,
  AI_MODIFICATION_OPERATION_TYPES,
  AI_MODIFICATION_PLAN_SCHEMA_VERSION,
  AI_MODIFICATION_PLAN_STATUSES,
  AI_MODIFICATION_PLAN_TYPE,
} from '../constants/ai-modification-plan.constant';

export type AiModificationPlanStatus =
  (typeof AI_MODIFICATION_PLAN_STATUSES)[number];

export type AiModificationOperationType =
  (typeof AI_MODIFICATION_OPERATION_TYPES)[number];

export type AiModificationContextRequestReason =
  (typeof AI_MODIFICATION_CONTEXT_REQUEST_REASONS)[number];

export interface AiModificationDatabaseRowInput {
  values: Record<string, RowValueData>;
}

export interface AiCreateDatabaseRowsOperation {
  type: 'CREATE_DATABASE_ROWS';
  databaseId: string;
  rows: AiModificationDatabaseRowInput[];
}

export interface AiTextBlockInput {
  type: PageBlockType.TEXT;
  content: {
    text: string;
  };
}

export interface AiQuoteBlockInput {
  type: PageBlockType.QUOTE;
  content: {
    text: string;
  };
}

export interface AiTodoBlockInput {
  type: PageBlockType.TODO;
  content: {
    text: string;
    checked: boolean;
  };
}

export interface AiToggleBlockInput {
  type: PageBlockType.TOGGLE;
  content: {
    text: string;
  };
}

export interface AiHeaderBlockInput {
  type: PageBlockType.HEADER;
  content: {
    text: string;
  };
  styleConfig?: {
    level?: number;
  };
}

export type AiModificationBlockInput =
  | AiTextBlockInput
  | AiQuoteBlockInput
  | AiTodoBlockInput
  | AiToggleBlockInput
  | AiHeaderBlockInput;

export interface AiInsertBlocksOperation {
  type: 'INSERT_BLOCKS';

  /**
   * Existing parent block from AiPageContext.
   *
   * null means root-level insertion.
   */
  parentBlockId: string | null;

  /**
   * Existing sibling block from AiPageContext.
   *
   * null means append to the end of the sibling group.
   */
  afterBlockId: string | null;

  blocks: AiModificationBlockInput[];
}

export type AiModificationOperation =
  | AiCreateDatabaseRowsOperation
  | AiInsertBlocksOperation;

export interface AiModificationContextRequest {
  /**
   * Machine-readable reason from the supported Planner whitelist.
   */
  reason: AiModificationContextRequestReason;

  /**
   * Human-readable explanation of the missing context.
   */
  description: string;

  /**
   * Optional existing database reference from AiPageContext.
   */
  databaseId?: string;

  /**
   * Optional existing block reference from AiPageContext.
   */
  blockId?: string;

  /**
   * Optional clarification question for the user.
   */
  question?: string;
}

export interface AiModificationPlanReady {
  schemaVersion: typeof AI_MODIFICATION_PLAN_SCHEMA_VERSION;
  type: typeof AI_MODIFICATION_PLAN_TYPE;
  pageId: string;
  status: 'PLAN_READY';
  summary: string;
  operations: AiModificationOperation[];
}

export interface AiModificationPlanNeedMoreContext {
  schemaVersion: typeof AI_MODIFICATION_PLAN_SCHEMA_VERSION;
  type: typeof AI_MODIFICATION_PLAN_TYPE;
  pageId: string;
  status: 'NEED_MORE_CONTEXT';
  summary: string;

  /**
   * NEED_MORE_CONTEXT must never contain executable operations.
   */
  operations: [];

  contextRequests: AiModificationContextRequest[];
}

export type AiModificationPlan =
  | AiModificationPlanReady
  | AiModificationPlanNeedMoreContext;
