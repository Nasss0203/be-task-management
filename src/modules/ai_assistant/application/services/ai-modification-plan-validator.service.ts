import { BadGatewayException, Injectable } from '@nestjs/common';

import { PropertyType } from 'src/modules/database/domain/enums/property-type.enum';

import {
  AI_MODIFICATION_CONTEXT_REQUEST_REASONS,
  AI_MODIFICATION_OPERATION_TYPES,
  AI_MODIFICATION_PLAN_SCHEMA_VERSION,
  AI_MODIFICATION_PLAN_STATUSES,
  AI_MODIFICATION_PLAN_TYPE,
  AI_MODIFICATION_SUPPORTED_BLOCK_TYPES,
  AI_MODIFICATION_SUPPORTED_PROPERTY_TYPES,
} from '../constants/ai-modification-plan.constant';

import {
  type AiDatabaseContextDto,
  type AiDatabasePropertyContextDto,
  type AiPageBlockContextDto,
  type AiPageContextResponseDto,
} from '../dto/response/ai-page-context.response.dto';

import { PageBlockType } from 'src/shared/domain/page-block-type.enum';
import {
  type AiCreateDatabaseRowsOperation,
  type AiInsertBlocksOperation,
  type AiModificationBlockInput,
  type AiModificationContextRequest,
  type AiModificationOperation,
  type AiModificationPlan,
} from '../types/ai-modification-plan';

@Injectable()
export class AiModificationPlanValidatorService {
  validate(
    input: unknown,

    context: AiPageContextResponseDto,
  ): AiModificationPlan {
    const plan = this.requireRecord(input, 'AI modification plan');

    this.assertExactKeys(
      plan,

      [
        'schemaVersion',

        'type',

        'pageId',

        'status',

        'summary',

        'operations',

        'contextRequests',
      ],

      'AI modification plan',

      ['contextRequests'],
    );

    if (plan.schemaVersion !== AI_MODIFICATION_PLAN_SCHEMA_VERSION) {
      this.fail(
        `Invalid AI modification plan schemaVersion. Expected ${AI_MODIFICATION_PLAN_SCHEMA_VERSION}`,
      );
    }

    if (plan.type !== AI_MODIFICATION_PLAN_TYPE) {
      this.fail(
        `Invalid AI modification plan type. Expected ${AI_MODIFICATION_PLAN_TYPE}`,
      );
    }

    const pageId = this.requireNonEmptyString(
      plan.pageId,

      'AI modification plan pageId',
    );

    if (pageId !== context.page.id) {
      this.fail(
        `AI modification plan pageId ${pageId} does not match authorized page ${context.page.id}`,
      );
    }

    const status = this.requireNonEmptyString(
      plan.status,

      'AI modification plan status',
    );

    if (!this.isPlanStatus(status)) {
      this.fail(`Unsupported AI modification plan status: ${status}`);
    }

    const summary = this.requireNonEmptyString(
      plan.summary,

      'AI modification plan summary',
    );

    const operations = this.requireArray(
      plan.operations,

      'AI modification plan operations',
    );

    if (status === 'PLAN_READY') {
      if ('contextRequests' in plan && plan.contextRequests !== undefined) {
        this.fail('PLAN_READY must not contain contextRequests');
      }

      const validatedOperations = operations.map((operation, index) =>
        this.validateOperation(operation, context, index),
      );

      if (validatedOperations.length === 0) {
        this.fail('PLAN_READY must contain at least one operation');
      }

      return {
        schemaVersion: AI_MODIFICATION_PLAN_SCHEMA_VERSION,

        type: AI_MODIFICATION_PLAN_TYPE,

        pageId,

        status: 'PLAN_READY',

        summary,

        operations: validatedOperations,
      };
    }

    if (operations.length !== 0) {
      this.fail('NEED_MORE_CONTEXT must not contain executable operations');
    }

    const contextRequests = this.requireArray(
      plan.contextRequests,

      'AI modification plan contextRequests',
    );

    if (contextRequests.length === 0) {
      this.fail('NEED_MORE_CONTEXT must contain at least one context request');
    }

    return {
      schemaVersion: AI_MODIFICATION_PLAN_SCHEMA_VERSION,

      type: AI_MODIFICATION_PLAN_TYPE,

      pageId,

      status: 'NEED_MORE_CONTEXT',

      summary,

      operations: [],

      contextRequests: contextRequests.map((request, index) =>
        this.validateContextRequest(request, context, index),
      ),
    };
  }

  private validateOperation(
    input: unknown,

    context: AiPageContextResponseDto,

    index: number,
  ): AiModificationOperation {
    const operation = this.requireRecord(input, `operations[${index}]`);

    const type = this.requireNonEmptyString(
      operation.type,

      `operations[${index}].type`,
    );

    if (!this.isOperationType(type)) {
      this.fail(`Unsupported AI modification operation type: ${type}`);
    }

    switch (type) {
      case 'CREATE_DATABASE_ROWS':
        return this.validateCreateDatabaseRowsOperation(
          operation,

          context,

          index,
        );

      case 'INSERT_BLOCKS':
        return this.validateInsertBlocksOperation(operation, context, index);
    }
  }

  private validateCreateDatabaseRowsOperation(
    operation: Record<string, unknown>,

    context: AiPageContextResponseDto,

    index: number,
  ): AiCreateDatabaseRowsOperation {
    this.assertExactKeys(
      operation,

      ['type', 'databaseId', 'rows'],

      `operations[${index}]`,
    );

    const databaseId = this.requireNonEmptyString(
      operation.databaseId,

      `operations[${index}].databaseId`,
    );

    const database = context.databases.find(
      (candidate) => candidate.id === databaseId,
    );

    if (!database) {
      this.fail(
        `Database ${databaseId} is not available in the authorized AI page context`,
      );
    }

    const rows = this.requireArray(operation.rows, `operations[${index}].rows`);

    if (rows.length === 0) {
      this.fail(`operations[${index}].rows must contain at least one row`);
    }

    return {
      type: 'CREATE_DATABASE_ROWS',

      databaseId,

      rows: rows.map((row, rowIndex) => {
        const rowRecord = this.requireRecord(
          row,

          `operations[${index}].rows[${rowIndex}]`,
        );

        this.assertExactKeys(
          rowRecord,

          ['values'],

          `operations[${index}].rows[${rowIndex}]`,
        );

        const values = this.requireRecord(
          rowRecord.values,

          `operations[${index}].rows[${rowIndex}].values`,
        );

        const validatedValues: Record<string, any> = {};

        for (const [propertyId, value] of Object.entries(values)) {
          const property = database.properties.find(
            (candidate) => candidate.id === propertyId,
          );

          if (!property) {
            this.fail(
              `Property ${propertyId} does not belong to database ${databaseId}`,
            );
          }

          this.validatePropertyValue(
            database,

            property,

            value,

            `operations[${index}].rows[${rowIndex}].values.${propertyId}`,
          );

          validatedValues[propertyId] = value;
        }

        return {
          values: validatedValues,
        };
      }),
    };
  }

  private validateInsertBlocksOperation(
    operation: Record<string, unknown>,

    context: AiPageContextResponseDto,

    index: number,
  ): AiInsertBlocksOperation {
    this.assertExactKeys(
      operation,

      ['type', 'parentBlockId', 'afterBlockId', 'blocks'],

      `operations[${index}]`,
    );

    const parentBlockId = this.requireNullableString(
      operation.parentBlockId,

      `operations[${index}].parentBlockId`,
    );

    const afterBlockId = this.requireNullableString(
      operation.afterBlockId,

      `operations[${index}].afterBlockId`,
    );

    if (parentBlockId !== null) {
      const parent = this.findBlock(context, parentBlockId);

      if (!parent) {
        this.fail(
          `Parent block ${parentBlockId} is not available in the authorized AI page context`,
        );
      }

      if (parent.type !== PageBlockType.TOGGLE) {
        this.fail(`Parent block ${parentBlockId} cannot contain child blocks`);
      }
    }

    if (afterBlockId !== null) {
      const anchor = this.findBlock(context, afterBlockId);

      if (!anchor) {
        this.fail(
          `After block ${afterBlockId} is not available in the authorized AI page context`,
        );
      }

      if (anchor.parentBlockId !== parentBlockId) {
        this.fail(
          `After block ${afterBlockId} is not in the requested sibling group`,
        );
      }
    }

    const blocks = this.requireArray(
      operation.blocks,

      `operations[${index}].blocks`,
    );

    if (blocks.length === 0) {
      this.fail(`operations[${index}].blocks must contain at least one block`);
    }

    return {
      type: 'INSERT_BLOCKS',

      parentBlockId,

      afterBlockId,

      blocks: blocks.map((block, blockIndex) =>
        this.validateBlockInput(
          block,

          `operations[${index}].blocks[${blockIndex}]`,
        ),
      ),
    };
  }

  private validateBlockInput(
    input: unknown,

    path: string,
  ): AiModificationBlockInput {
    const block = this.requireRecord(input, path);

    const type = this.requireNonEmptyString(block.type, `${path}.type`);

    if (!this.isSupportedBlockType(type)) {
      this.fail(`Unsupported block type at ${path}: ${type}`);
    }

    const content = this.requireRecord(block.content, `${path}.content`);

    switch (type) {
      case PageBlockType.TEXT:

      case PageBlockType.QUOTE:

      case PageBlockType.TOGGLE: {
        this.assertExactKeys(block, ['type', 'content'], path);

        this.assertExactKeys(content, ['text'], `${path}.content`);

        const text = this.requireNonEmptyString(
          content.text,

          `${path}.content.text`,
        );

        return {
          type,

          content: {
            text,
          },
        };
      }

      case PageBlockType.TODO: {
        this.assertExactKeys(block, ['type', 'content'], path);

        this.assertExactKeys(content, ['text', 'checked'], `${path}.content`);

        const text = this.requireNonEmptyString(
          content.text,

          `${path}.content.text`,
        );

        if (typeof content.checked !== 'boolean') {
          this.fail(`${path}.content.checked must be a boolean`);
        }

        return {
          type: PageBlockType.TODO,

          content: {
            text,

            checked: content.checked,
          },
        };
      }

      case PageBlockType.HEADER: {
        this.assertExactKeys(block, ['type', 'content', 'styleConfig'], path, [
          'styleConfig',
        ]);

        this.assertExactKeys(content, ['text'], `${path}.content`);

        const text = this.requireNonEmptyString(
          content.text,

          `${path}.content.text`,
        );

        if (block.styleConfig === undefined) {
          return {
            type: PageBlockType.HEADER,

            content: {
              text,
            },
          };
        }

        const styleConfig = this.requireRecord(
          block.styleConfig,

          `${path}.styleConfig`,
        );

        this.assertExactKeys(styleConfig, ['level'], `${path}.styleConfig`, [
          'level',
        ]);

        if (styleConfig.level === undefined) {
          return {
            type: PageBlockType.HEADER,

            content: {
              text,
            },

            styleConfig: {},
          };
        }

        if (
          typeof styleConfig.level !== 'number' ||
          !Number.isInteger(styleConfig.level)
        ) {
          this.fail(`${path}.styleConfig.level must be an integer`);
        }

        return {
          type: PageBlockType.HEADER,

          content: {
            text,
          },

          styleConfig: {
            level: styleConfig.level,
          },
        };
      }
    }
  }

  private validatePropertyValue(
    database: AiDatabaseContextDto,

    property: AiDatabasePropertyContextDto,

    value: unknown,

    path: string,
  ): void {
    if (!this.isSupportedPropertyType(property.type)) {
      this.fail(
        `Property ${property.id} of type ${property.type} is not writable by AI modification planner v1`,
      );
    }

    if (value === null) {
      return;
    }

    switch (property.type) {
      case PropertyType.TITLE:

      case PropertyType.TEXT:

      case PropertyType.URL:

      case PropertyType.EMAIL:

      case PropertyType.PHONE:
        if (typeof value !== 'string') {
          this.fail(`${path} must be a string or null`);
        }

        return;

      case PropertyType.NUMBER:
        if (typeof value !== 'number' || !Number.isFinite(value)) {
          this.fail(`${path} must be a finite number or null`);
        }

        return;

      case PropertyType.SELECT:

      case PropertyType.STATUS:
        this.validateSingleOptionValue(property, value, path);

        return;

      case PropertyType.MULTI_SELECT:
        this.validateMultipleOptionValue(property, value, path);

        return;

      case PropertyType.CHECKBOX:
        if (typeof value !== 'boolean') {
          this.fail(`${path} must be a boolean or null`);
        }

        return;

      case PropertyType.DATE:
        this.validateDateValue(value, path);

        return;

      default:
        this.fail(
          `Unsupported writable property type ${property.type} in database ${database.id}`,
        );
    }
  }

  private validateSingleOptionValue(
    property: AiDatabasePropertyContextDto,

    value: unknown,

    path: string,
  ): void {
    if (typeof value !== 'string' || value.trim().length === 0) {
      this.fail(`${path} must be an option ID or null`);
    }

    const optionExists = property.options.some((option) => option.id === value);

    if (!optionExists) {
      this.fail(`Option ${value} does not belong to property ${property.id}`);
    }
  }

  private validateMultipleOptionValue(
    property: AiDatabasePropertyContextDto,

    value: unknown,

    path: string,
  ): void {
    if (!Array.isArray(value)) {
      this.fail(`${path} must be an array of option IDs or null`);
    }

    for (let index = 0; index < value.length; index += 1) {
      const optionId = value[index];

      if (typeof optionId !== 'string' || optionId.trim().length === 0) {
        this.fail(`${path}[${index}] must be an option ID`);
      }

      const optionExists = property.options.some(
        (option) => option.id === optionId,
      );

      if (!optionExists) {
        this.fail(
          `Option ${optionId} does not belong to property ${property.id}`,
        );
      }
    }
  }

  private validateDateValue(value: unknown, path: string): void {
    const date = this.requireRecord(value, path);

    this.assertExactKeys(date, ['start', 'end'], path, ['end']);

    if (typeof date.start !== 'string' || date.start.trim().length === 0) {
      this.fail(`${path}.start must be a non-empty string`);
    }

    if (
      date.end !== undefined &&
      date.end !== null &&
      typeof date.end !== 'string'
    ) {
      this.fail(`${path}.end must be a string, null, or omitted`);
    }
  }

  private validateContextRequest(
    input: unknown,
    context: AiPageContextResponseDto,
    index: number,
  ): AiModificationContextRequest {
    const request = this.requireRecord(input, `contextRequests[${index}]`);

    this.assertExactKeys(
      request,
      ['reason', 'description', 'databaseId', 'blockId', 'question'],
      `contextRequests[${index}]`,
      ['databaseId', 'blockId', 'question'],
    );

    const reason = this.requireNonEmptyString(
      request.reason,
      `contextRequests[${index}].reason`,
    );

    if (!this.isContextRequestReason(reason)) {
      this.fail(`Unsupported context request reason: ${reason}`);
    }

    const description = this.requireNonEmptyString(
      request.description,
      `contextRequests[${index}].description`,
    );

    const databaseId =
      request.databaseId === undefined
        ? undefined
        : this.requireNonEmptyString(
            request.databaseId,
            `contextRequests[${index}].databaseId`,
          );

    if (
      databaseId !== undefined &&
      !context.databases.some((database) => database.id === databaseId)
    ) {
      this.fail(
        `Context request database ${databaseId} is not available in the authorized AI page context`,
      );
    }

    const blockId =
      request.blockId === undefined
        ? undefined
        : this.requireNonEmptyString(
            request.blockId,
            `contextRequests[${index}].blockId`,
          );

    if (
      blockId !== undefined &&
      !context.blocks.some((block) => block.id === blockId)
    ) {
      this.fail(
        `Context request block ${blockId} is not available in the authorized AI page context`,
      );
    }

    const question =
      request.question === undefined
        ? undefined
        : this.requireNonEmptyString(
            request.question,
            `contextRequests[${index}].question`,
          );

    switch (reason) {
      case 'ROWS_TRUNCATED': {
        if (databaseId !== undefined) {
          const rowsCompleteness = context.completeness.rows.find(
            (row) => row.databaseId === databaseId,
          );

          if (!rowsCompleteness?.truncated) {
            this.fail(
              `ROWS_TRUNCATED requires truncated rows for database ${databaseId}`,
            );
          }
        } else {
          const hasTruncatedRows = context.completeness.rows.some(
            (row) => row.truncated,
          );

          if (!hasTruncatedRows) {
            this.fail(
              'ROWS_TRUNCATED requires at least one database with truncated rows',
            );
          }
        }

        break;
      }

      case 'TEXT_TRUNCATED':
        if (!context.completeness.textTruncated) {
          this.fail('TEXT_TRUNCATED requires textTruncated=true');
        }

        break;

      case 'AMBIGUOUS_TARGET':
        if (question === undefined) {
          this.fail('AMBIGUOUS_TARGET requires a clarification question');
        }

        break;

      case 'MISSING_RESOURCE_CONTEXT':
        break;
    }

    return {
      reason,
      description,
      ...(databaseId !== undefined ? { databaseId } : {}),
      ...(blockId !== undefined ? { blockId } : {}),
      ...(question !== undefined ? { question } : {}),
    };
  }

  private findBlock(
    context: AiPageContextResponseDto,

    blockId: string,
  ): AiPageBlockContextDto | undefined {
    return context.blocks.find((block) => block.id === blockId);
  }

  private requireRecord(value: unknown, path: string): Record<string, unknown> {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      this.fail(`${path} must be an object`);
    }

    return value as Record<string, unknown>;
  }

  private requireArray(value: unknown, path: string): unknown[] {
    if (!Array.isArray(value)) {
      this.fail(`${path} must be an array`);
    }

    return value;
  }

  private requireNonEmptyString(value: unknown, path: string): string {
    if (typeof value !== 'string' || value.trim().length === 0) {
      this.fail(`${path} must be a non-empty string`);
    }

    return value;
  }

  private requireNullableString(value: unknown, path: string): string | null {
    if (value === null) {
      return null;
    }

    return this.requireNonEmptyString(value, path);
  }

  private assertExactKeys(
    value: Record<string, unknown>,

    allowedKeys: readonly string[],

    path: string,

    optionalKeys: readonly string[] = [],
  ): void {
    const allowed = new Set(allowedKeys);

    for (const key of Object.keys(value)) {
      if (!allowed.has(key)) {
        this.fail(`${path} contains unsupported field: ${key}`);
      }
    }

    const optional = new Set(optionalKeys);

    for (const key of allowedKeys) {
      if (!optional.has(key) && !(key in value)) {
        this.fail(`${path} is missing required field: ${key}`);
      }
    }
  }

  private isPlanStatus(
    value: string,
  ): value is (typeof AI_MODIFICATION_PLAN_STATUSES)[number] {
    return (AI_MODIFICATION_PLAN_STATUSES as readonly string[]).includes(value);
  }

  private isOperationType(
    value: string,
  ): value is (typeof AI_MODIFICATION_OPERATION_TYPES)[number] {
    return (AI_MODIFICATION_OPERATION_TYPES as readonly string[]).includes(
      value,
    );
  }

  private isSupportedBlockType(
    value: string,
  ): value is (typeof AI_MODIFICATION_SUPPORTED_BLOCK_TYPES)[number] {
    return (
      AI_MODIFICATION_SUPPORTED_BLOCK_TYPES as readonly string[]
    ).includes(value);
  }

  private isSupportedPropertyType(value: PropertyType): boolean {
    return (
      AI_MODIFICATION_SUPPORTED_PROPERTY_TYPES as readonly PropertyType[]
    ).includes(value);
  }

  private isContextRequestReason(
    value: string,
  ): value is (typeof AI_MODIFICATION_CONTEXT_REQUEST_REASONS)[number] {
    return (
      AI_MODIFICATION_CONTEXT_REQUEST_REASONS as readonly string[]
    ).includes(value);
  }

  private fail(message: string): never {
    throw new BadGatewayException({
      code: 'INVALID_PLAN',
      message: `Invalid AI modification plan: ${message}`,
    });
  }
}
