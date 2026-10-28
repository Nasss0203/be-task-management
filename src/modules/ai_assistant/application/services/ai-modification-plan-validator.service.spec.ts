import { BadGatewayException } from '@nestjs/common';

import { PageBlockType } from 'src/shared/domain/page-block-type.enum';

import { DatabaseViewType } from 'src/modules/database/domain/enums/database-view-type.enum';

import { PropertyType } from 'src/modules/database/domain/enums/property-type.enum';

import { AI_PAGE_CONTEXT_SCHEMA_VERSION } from '../constants/ai-page-context.constant';

import type { AiPageContextResponseDto } from '../dto/response/ai-page-context.response.dto';

import { AiModificationPlanValidatorService } from './ai-modification-plan-validator.service';

describe('AiModificationPlanValidatorService', () => {
  let validator: AiModificationPlanValidatorService;

  let context: AiPageContextResponseDto;

  beforeEach(() => {
    validator = new AiModificationPlanValidatorService();

    context = {
      schemaVersion: AI_PAGE_CONTEXT_SCHEMA_VERSION,

      builtAt: '2026-10-05T09:00:00.000Z',

      page: {
        id: 'page-1',

        workspaceId: 'workspace-1',

        teamspaceId: null,

        parentPageId: null,

        title: 'Release 1.0',

        icon: null,

        coverUrl: null,

        updatedAt: '2026-10-05T08:00:00.000Z',
      },

      blocks: [
        {
          id: 'block-root',

          parentBlockId: null,

          type: PageBlockType.HEADER,

          orderIndex: 0,

          title: null,

          content: {
            text: 'Release 1.0',
          },

          styleConfig: {
            level: 1,
          },

          dataConfig: null,
        },

        {
          id: 'block-toggle',

          parentBlockId: null,

          type: PageBlockType.TOGGLE,

          orderIndex: 1,

          title: null,

          content: {
            text: 'Details',
          },

          styleConfig: null,

          dataConfig: null,
        },

        {
          id: 'block-child',

          parentBlockId: 'block-toggle',

          type: PageBlockType.TEXT,

          orderIndex: 0,

          title: null,

          content: {
            text: 'Existing child',
          },

          styleConfig: null,

          dataConfig: null,
        },

        {
          id: 'block-database',

          parentBlockId: null,

          type: PageBlockType.DATABASE_VIEW,

          orderIndex: 2,

          title: null,

          content: null,

          styleConfig: null,

          dataConfig: {
            database_id: 'database-1',

            view_id: 'view-1',
          },
        },
      ],

      databaseReferences: [
        {
          blockId: 'block-database',

          databaseId: 'database-1',

          viewId: 'view-1',
        },
      ],

      databases: [
        {
          id: 'database-1',

          pageId: 'page-1',

          name: 'Release Tasks',

          properties: [
            {
              id: 'property-title',

              name: 'Name',

              type: PropertyType.TITLE,

              position: '0',

              isDefault: true,

              isHideable: false,

              options: [],
            },

            {
              id: 'property-status',

              name: 'Status',

              type: PropertyType.STATUS,

              position: '1',

              isDefault: false,

              isHideable: true,

              options: [
                {
                  id: 'option-todo',

                  name: 'Todo',

                  color: 'gray',

                  position: '0',
                },

                {
                  id: 'option-done',

                  name: 'Done',

                  color: 'green',

                  position: '1',
                },
              ],
            },

            {
              id: 'property-priority',

              name: 'Priority',

              type: PropertyType.SELECT,

              position: '2',

              isDefault: false,

              isHideable: true,

              options: [
                {
                  id: 'option-high',

                  name: 'High',

                  color: 'red',

                  position: '0',
                },
              ],
            },

            {
              id: 'property-points',

              name: 'Story Points',

              type: PropertyType.NUMBER,

              position: '3',

              isDefault: false,

              isHideable: true,

              options: [],
            },
          ],

          views: [
            {
              id: 'view-1',

              databaseId: 'database-1',

              name: 'Table',

              type: DatabaseViewType.TABLE,

              position: '0',

              properties: [],
            },
          ],

          rows: [],
        },
      ],

      completeness: {
        blocks: {
          total: 4,

          included: 4,

          truncated: false,
        },

        databases: {
          total: 1,

          included: 1,

          truncated: false,
        },

        rows: [
          {
            databaseId: 'database-1',

            total: 0,

            included: 0,

            truncated: false,

            selection: 'BOUNDED',
          },
        ],

        textTruncated: false,
      },
    } as AiPageContextResponseDto;
  });

  it('returns INVALID_PLAN error code when plan validation fails', () => {
    const input = {
      schemaVersion: 1,
      type: 'AI_MODIFICATION_PLAN',
      pageId: 'page-outside-context',
      status: 'PLAN_READY',
      summary: 'Invalid target page',
      operations: [
        {
          type: 'INSERT_BLOCKS',
          parentBlockId: null,
          afterBlockId: null,
          blocks: [
            {
              type: PageBlockType.TEXT,
              content: {
                text: 'Should not be accepted',
              },
            },
          ],
        },
      ],
    };

    try {
      validator.validate(input, context);

      throw new Error('Expected validation to fail');
    } catch (error) {
      expect(error).toBeInstanceOf(BadGatewayException);

      expect((error as BadGatewayException).getResponse()).toEqual({
        code: 'INVALID_PLAN',
        message:
          'Invalid AI modification plan: AI modification plan pageId page-outside-context does not match authorized page page-1',
      });
    }
  });

  it('validates a PLAN_READY result with supported operations', () => {
    const input = {
      schemaVersion: 1,

      type: 'AI_MODIFICATION_PLAN',

      pageId: 'page-1',

      status: 'PLAN_READY',

      summary: 'Add release tasks and checklist',

      operations: [
        {
          type: 'CREATE_DATABASE_ROWS',

          databaseId: 'database-1',

          rows: [
            {
              values: {
                'property-title': 'Verify production variables',

                'property-status': 'option-todo',

                'property-priority': 'option-high',

                'property-points': 3,
              },
            },
          ],
        },

        {
          type: 'INSERT_BLOCKS',

          parentBlockId: null,

          afterBlockId: 'block-root',

          blocks: [
            {
              type: PageBlockType.TEXT,

              content: {
                text: 'Release checklist',
              },
            },

            {
              type: PageBlockType.TODO,

              content: {
                text: 'Confirm database migrations',

                checked: false,
              },
            },
          ],
        },
      ],
    };

    const result = validator.validate(input, context);

    expect(result.status).toBe('PLAN_READY');

    if (result.status !== 'PLAN_READY') {
      throw new Error('Expected PLAN_READY result');
    }

    expect(result.pageId).toBe('page-1');

    expect(result.operations).toHaveLength(2);

    expect(result.operations[0]).toEqual({
      type: 'CREATE_DATABASE_ROWS',

      databaseId: 'database-1',

      rows: [
        {
          values: {
            'property-title': 'Verify production variables',

            'property-status': 'option-todo',

            'property-priority': 'option-high',

            'property-points': 3,
          },
        },
      ],
    });

    expect(result.operations[1]).toEqual({
      type: 'INSERT_BLOCKS',

      parentBlockId: null,

      afterBlockId: 'block-root',

      blocks: [
        {
          type: PageBlockType.TEXT,

          content: {
            text: 'Release checklist',
          },
        },

        {
          type: PageBlockType.TODO,

          content: {
            text: 'Confirm database migrations',

            checked: false,
          },
        },
      ],
    });
  });

  it('validates NEED_MORE_CONTEXT when database rows are truncated', () => {
    const truncatedRowsContext: AiPageContextResponseDto = {
      ...context,
      completeness: {
        ...context.completeness,
        rows: context.completeness.rows.map((row) =>
          row.databaseId === 'database-1'
            ? {
                ...row,
                total: 100,
                included: 50,
                truncated: true,
              }
            : row,
        ),
      },
    };

    const input = {
      schemaVersion: 1,
      type: 'AI_MODIFICATION_PLAN',
      pageId: 'page-1',
      status: 'NEED_MORE_CONTEXT',
      summary: 'More database rows are required',
      operations: [],
      contextRequests: [
        {
          reason: 'ROWS_TRUNCATED',
          description:
            'The current database context does not contain all rows.',
          databaseId: 'database-1',
          question:
            'Should I inspect more rows before deciding which tasks are missing?',
        },
      ],
    };

    const result = validator.validate(input, truncatedRowsContext);

    expect(result.status).toBe('NEED_MORE_CONTEXT');

    if (result.status !== 'NEED_MORE_CONTEXT') {
      throw new Error('Expected NEED_MORE_CONTEXT result');
    }

    expect(result.operations).toEqual([]);

    expect(result.contextRequests).toEqual([
      {
        reason: 'ROWS_TRUNCATED',
        description: 'The current database context does not contain all rows.',
        databaseId: 'database-1',
        question:
          'Should I inspect more rows before deciding which tasks are missing?',
      },
    ]);
  });

  it('rejects ROWS_TRUNCATED when the requested database rows are complete', () => {
    const input = {
      schemaVersion: 1,
      type: 'AI_MODIFICATION_PLAN',
      pageId: 'page-1',
      status: 'NEED_MORE_CONTEXT',
      summary: 'More database rows are required',
      operations: [],
      contextRequests: [
        {
          reason: 'ROWS_TRUNCATED',
          description:
            'The current database context does not contain all rows.',
          databaseId: 'database-1',
        },
      ],
    };

    expect(() => validator.validate(input, context)).toThrow(
      'ROWS_TRUNCATED requires truncated rows for database database-1',
    );
  });

  it('rejects TEXT_TRUNCATED when page context text is complete', () => {
    const input = {
      schemaVersion: 1,
      type: 'AI_MODIFICATION_PLAN',
      pageId: 'page-1',
      status: 'NEED_MORE_CONTEXT',
      summary: 'More text context is required',
      operations: [],
      contextRequests: [
        {
          reason: 'TEXT_TRUNCATED',
          description: 'The page text was truncated.',
          blockId: 'block-child',
        },
      ],
    };

    expect(() => validator.validate(input, context)).toThrow(
      'TEXT_TRUNCATED requires textTruncated=true',
    );
  });

  it('rejects AMBIGUOUS_TARGET without a clarification question', () => {
    const input = {
      schemaVersion: 1,
      type: 'AI_MODIFICATION_PLAN',
      pageId: 'page-1',
      status: 'NEED_MORE_CONTEXT',
      summary: 'The target is ambiguous',
      operations: [],
      contextRequests: [
        {
          reason: 'AMBIGUOUS_TARGET',
          description: 'The requested target cannot be determined uniquely.',
        },
      ],
    };

    expect(() => validator.validate(input, context)).toThrow(
      'AMBIGUOUS_TARGET requires a clarification question',
    );
  });

  it('rejects an invented database ID', () => {
    const input = {
      schemaVersion: 1,

      type: 'AI_MODIFICATION_PLAN',

      pageId: 'page-1',

      status: 'PLAN_READY',

      summary: 'Add task',

      operations: [
        {
          type: 'CREATE_DATABASE_ROWS',

          databaseId: 'database-outside-context',

          rows: [
            {
              values: {
                'property-title': 'Task',
              },
            },
          ],
        },
      ],
    };

    expect(() => validator.validate(input, context)).toThrow(
      'Database database-outside-context is not available in the authorized AI page context',
    );
  });

  it('rejects an option ID that does not belong to the selected property', () => {
    const input = {
      schemaVersion: 1,

      type: 'AI_MODIFICATION_PLAN',

      pageId: 'page-1',

      status: 'PLAN_READY',

      summary: 'Add task',

      operations: [
        {
          type: 'CREATE_DATABASE_ROWS',

          databaseId: 'database-1',

          rows: [
            {
              values: {
                'property-title': 'Task',

                'property-status': 'option-high',
              },
            },
          ],
        },
      ],
    };

    expect(() => validator.validate(input, context)).toThrow(
      'Option option-high does not belong to property property-status',
    );
  });

  it('rejects an afterBlockId from a different sibling group', () => {
    const input = {
      schemaVersion: 1,

      type: 'AI_MODIFICATION_PLAN',

      pageId: 'page-1',

      status: 'PLAN_READY',

      summary: 'Insert child',

      operations: [
        {
          type: 'INSERT_BLOCKS',

          parentBlockId: 'block-toggle',

          afterBlockId: 'block-root',

          blocks: [
            {
              type: PageBlockType.TEXT,

              content: {
                text: 'New child',
              },
            },
          ],
        },
      ],
    };

    expect(() => validator.validate(input, context)).toThrow(
      'After block block-root is not in the requested sibling group',
    );
  });

  describe('DELETE_BLOCK (kế hoạch xoá block)', () => {
    const remove = (operation: Record<string, unknown> = {}) => ({
      type: 'DELETE_BLOCK',
      blockId: 'block-toggle',
      text: 'Details',
      childCount: 1,
      ...operation,
    });
    const plan = (...operations: Record<string, unknown>[]) => ({
      schemaVersion: 1,
      type: 'AI_MODIFICATION_PLAN',
      pageId: 'page-1',
      status: 'PLAN_READY',
      summary: 'Xoá 1 block',
      operations,
    });

    it('accepts a toggle with the right number of nested blocks', () => {
      expect(validator.validate(plan(remove()), context)).toEqual(
        plan(remove()),
      );
    });

    it.each([
      [remove({ blockId: 'missing' }), 'not available'],
      [remove({ text: 'Other' }), 'does not match'],
      // A block nested after the draft must not be deleted unseen.
      [remove({ childCount: 0 }), 'childCount'],
      [remove({ childCount: -1 }), 'childCount'],
      [remove({ extra: true }), 'unsupported field'],
    ])('rejects %j', (operation, message) => {
      expect(() => validator.validate(plan(operation), context)).toThrow(
        new RegExp(message, 'i'),
      );
    });

    it('rejects deleting a block nested in another deleted block', () => {
      expect(() =>
        validator.validate(
          plan(
            remove(),
            remove({
              blockId: 'block-child',
              text: 'Existing child',
              childCount: 0,
            }),
          ),
          context,
        ),
      ).toThrow(/nested/);
    });
  });

  describe('SET_BLOCK_TEXT (kế hoạch sửa chữ block)', () => {
    const edit = (operation: Record<string, unknown> = {}) => ({
      type: 'SET_BLOCK_TEXT',
      blockId: 'block-root',
      oldText: 'Release 1.0',
      newText: 'Release 1.1',
      ...operation,
    });
    const plan = (...operations: Record<string, unknown>[]) => ({
      schemaVersion: 1,
      type: 'AI_MODIFICATION_PLAN',
      pageId: 'page-1',
      status: 'PLAN_READY',
      summary: 'Sửa 1 block',
      operations,
    });

    it('accepts a text change of a block of the page', () => {
      expect(validator.validate(plan(edit()), context)).toEqual(plan(edit()));
    });

    it.each([
      [edit({ blockId: 'missing' }), 'not available'],
      // oldText guards against a stale or invented text.
      [edit({ oldText: 'Release 0.9' }), 'does not match'],
      [edit({ newText: 'Release 1.0' }), 'not changed'],
      [edit({ newText: '   ' }), 'newText'],
      [edit({ newText: 'x'.repeat(2001) }), '2000'],
      [edit({ content: { text: 'x' } }), 'unsupported field'],
    ])('rejects %j', (operation, message) => {
      expect(() => validator.validate(plan(operation), context)).toThrow(
        new RegExp(message, 'i'),
      );
    });

    it('rejects two changes of the same block in one plan', () => {
      expect(() =>
        validator.validate(plan(edit(), edit({ newText: 'Other' })), context),
      ).toThrow(/more than once/);
    });
  });

  describe('SET_TODO_CHECKED (kế hoạch tích to-do)', () => {
    const todo = {
      id: 'block-todo',
      parentBlockId: null,
      type: PageBlockType.TODO,
      orderIndex: 2,
      title: null,
      content: { text: 'Gửi email', checked: false },
      styleConfig: null,
      dataConfig: null,
    };
    const tick = (operation: Record<string, unknown> = {}) => ({
      type: 'SET_TODO_CHECKED',
      blockId: 'block-todo',
      text: 'Gửi email',
      checked: true,
      ...operation,
    });
    const plan = (...operations: Record<string, unknown>[]) => ({
      schemaVersion: 1,
      type: 'AI_MODIFICATION_PLAN',
      pageId: 'page-1',
      status: 'PLAN_READY',
      summary: 'Tích 1 to-do: Gửi email',
      operations,
    });

    beforeEach(() => {
      context.blocks.push(todo);
    });

    it.each([true, false])(
      'accepts checked=%s for a to-do of the page',
      (checked) => {
        expect(validator.validate(plan(tick({ checked })), context)).toEqual(
          plan(tick({ checked })),
        );
      },
    );

    it.each([
      [tick({ blockId: 'missing' }), 'not available'],
      [tick({ blockId: 'block-root', text: 'Release 1.0' }), 'is not a to-do'],
      // text is only shown; it never renames the to-do.
      [tick({ text: 'Gửi email cho sếp' }), 'text does not match'],
      [tick({ checked: 'yes' }), 'checked must be a boolean'],
      [tick({ content: { text: 'x' } }), 'unsupported field'],
      [
        { type: 'SET_TODO_CHECKED', blockId: 'block-todo', checked: true },
        'text',
      ],
    ])('rejects %j', (operation, message) => {
      expect(() => validator.validate(plan(operation), context)).toThrow(
        new RegExp(message, 'i'),
      );
    });

    it('rejects the same to-do twice in one plan', () => {
      expect(() => validator.validate(plan(tick(), tick()), context)).toThrow(
        /more than once/,
      );
    });
  });

  it('rejects unsupported operation types', () => {
    const input = {
      schemaVersion: 1,

      type: 'AI_MODIFICATION_PLAN',

      pageId: 'page-1',

      status: 'PLAN_READY',

      summary: 'Delete something',

      operations: [
        {
          type: 'MOVE_BLOCK',

          blockId: 'block-root',
        },
      ],
    };

    expect(() => validator.validate(input, context)).toThrow(
      'Unsupported AI modification operation type: MOVE_BLOCK',
    );
  });

  it('rejects unknown fields returned by the model', () => {
    const input = {
      schemaVersion: 1,

      type: 'AI_MODIFICATION_PLAN',

      pageId: 'page-1',

      status: 'PLAN_READY',

      summary: 'Add task',

      operations: [
        {
          type: 'CREATE_DATABASE_ROWS',

          databaseId: 'database-1',

          rows: [
            {
              values: {
                'property-title': 'Task',
              },
            },
          ],

          dangerousField: 'should-not-be-accepted',
        },
      ],
    };

    expect(() => validator.validate(input, context)).toThrow(
      'operations[0] contains unsupported field: dangerousField',
    );
  });

  it('rejects a read-only system property', () => {
    context.databases[0].properties.push({
      id: 'property-created-time',

      name: 'Created time',

      type: PropertyType.CREATED_TIME,

      position: '4',

      isDefault: false,

      isHideable: true,

      options: [],
    });

    const input = {
      schemaVersion: 1,

      type: 'AI_MODIFICATION_PLAN',

      pageId: 'page-1',

      status: 'PLAN_READY',

      summary: 'Set created time',

      operations: [
        {
          type: 'CREATE_DATABASE_ROWS',

          databaseId: 'database-1',

          rows: [
            {
              values: {
                'property-created-time': null,
              },
            },
          ],
        },
      ],
    };

    expect(() => validator.validate(input, context)).toThrow(
      'Property property-created-time of type CREATED_TIME is not writable by AI modification planner v1',
    );
  });

  it('rejects a value that does not match the property type', () => {
    const input = {
      schemaVersion: 1,

      type: 'AI_MODIFICATION_PLAN',

      pageId: 'page-1',

      status: 'PLAN_READY',

      summary: 'Add task',

      operations: [
        {
          type: 'CREATE_DATABASE_ROWS',

          databaseId: 'database-1',

          rows: [
            {
              values: {
                'property-title': 'Task',

                'property-points': 'three',
              },
            },
          ],
        },
      ],
    };

    expect(() => validator.validate(input, context)).toThrow(
      'operations[0].rows[0].values.property-points must be a finite number or null',
    );
  });

  it('rejects NEED_MORE_CONTEXT when executable operations are present', () => {
    const input = {
      schemaVersion: 1,

      type: 'AI_MODIFICATION_PLAN',

      pageId: 'page-1',

      status: 'NEED_MORE_CONTEXT',

      summary: 'More context is required',

      operations: [
        {
          type: 'INSERT_BLOCKS',

          parentBlockId: null,

          afterBlockId: null,

          blocks: [
            {
              type: PageBlockType.TEXT,

              content: {
                text: 'This must not be executable',
              },
            },
          ],
        },
      ],

      contextRequests: [
        {
          reason: 'ROWS_TRUNCATED',

          description: 'More rows are required.',

          databaseId: 'database-1',
        },
      ],
    };

    expect(() => validator.validate(input, context)).toThrow(
      'NEED_MORE_CONTEXT must not contain executable operations',
    );
  });
  it('rejects an unsupported schemaVersion', () => {
    const input = {
      schemaVersion: 999,
      type: 'AI_MODIFICATION_PLAN',
      pageId: 'page-1',
      status: 'PLAN_READY',
      summary: 'Invalid schema',
      operations: [
        {
          type: 'INSERT_BLOCKS',
          parentBlockId: null,
          afterBlockId: null,
          blocks: [
            {
              type: PageBlockType.TEXT,
              content: {
                text: 'Example',
              },
            },
          ],
        },
      ],
    };

    expect(() => validator.validate(input, context)).toThrow(
      'Invalid AI modification plan schemaVersion',
    );
  });

  it('rejects an unsupported plan type', () => {
    const input = {
      schemaVersion: 1,
      type: 'WRONG_PLAN_TYPE',
      pageId: 'page-1',
      status: 'PLAN_READY',
      summary: 'Invalid type',
      operations: [
        {
          type: 'INSERT_BLOCKS',
          parentBlockId: null,
          afterBlockId: null,
          blocks: [
            {
              type: PageBlockType.TEXT,
              content: {
                text: 'Example',
              },
            },
          ],
        },
      ],
    };

    expect(() => validator.validate(input, context)).toThrow(
      'Invalid AI modification plan type',
    );
  });

  it('rejects an unsupported plan status', () => {
    const input = {
      schemaVersion: 1,
      type: 'AI_MODIFICATION_PLAN',
      pageId: 'page-1',
      status: 'UNKNOWN_STATUS',
      summary: 'Invalid status',
      operations: [],
    };

    expect(() => validator.validate(input, context)).toThrow(
      'Unsupported AI modification plan status: UNKNOWN_STATUS',
    );
  });

  it('rejects PLAN_READY with contextRequests', () => {
    const input = {
      schemaVersion: 1,
      type: 'AI_MODIFICATION_PLAN',
      pageId: 'page-1',
      status: 'PLAN_READY',
      summary: 'Invalid ready plan',
      operations: [
        {
          type: 'INSERT_BLOCKS',
          parentBlockId: null,
          afterBlockId: null,
          blocks: [
            {
              type: PageBlockType.TEXT,
              content: {
                text: 'Example',
              },
            },
          ],
        },
      ],
      contextRequests: [],
    };

    expect(() => validator.validate(input, context)).toThrow(
      'PLAN_READY must not contain contextRequests',
    );
  });

  it('rejects PLAN_READY without executable operations', () => {
    const input = {
      schemaVersion: 1,
      type: 'AI_MODIFICATION_PLAN',
      pageId: 'page-1',
      status: 'PLAN_READY',
      summary: 'Nothing to execute',
      operations: [],
    };

    expect(() => validator.validate(input, context)).toThrow(
      'PLAN_READY must contain at least one operation',
    );
  });

  it('rejects NEED_MORE_CONTEXT without context requests', () => {
    const input = {
      schemaVersion: 1,
      type: 'AI_MODIFICATION_PLAN',
      pageId: 'page-1',
      status: 'NEED_MORE_CONTEXT',
      summary: 'More context required',
      operations: [],
      contextRequests: [],
    };

    expect(() => validator.validate(input, context)).toThrow(
      'NEED_MORE_CONTEXT must contain at least one context request',
    );
  });

  it('rejects CREATE_DATABASE_ROWS without rows', () => {
    const input = {
      schemaVersion: 1,
      type: 'AI_MODIFICATION_PLAN',
      pageId: 'page-1',
      status: 'PLAN_READY',
      summary: 'Create rows',
      operations: [
        {
          type: 'CREATE_DATABASE_ROWS',
          databaseId: 'database-1',
          rows: [],
        },
      ],
    };

    expect(() => validator.validate(input, context)).toThrow(
      'operations[0].rows must contain at least one row',
    );
  });

  it('rejects INSERT_BLOCKS without blocks', () => {
    const input = {
      schemaVersion: 1,
      type: 'AI_MODIFICATION_PLAN',
      pageId: 'page-1',
      status: 'PLAN_READY',
      summary: 'Insert blocks',
      operations: [
        {
          type: 'INSERT_BLOCKS',
          parentBlockId: null,
          afterBlockId: null,
          blocks: [],
        },
      ],
    };

    expect(() => validator.validate(input, context)).toThrow(
      'operations[0].blocks must contain at least one block',
    );
  });
  it('rejects a property that does not belong to the target database', () => {
    const input = {
      schemaVersion: 1,
      type: 'AI_MODIFICATION_PLAN',
      pageId: 'page-1',
      status: 'PLAN_READY',
      summary: 'Add task',
      operations: [
        {
          type: 'CREATE_DATABASE_ROWS',
          databaseId: 'database-1',
          rows: [
            {
              values: {
                'property-missing': 'Task',
              },
            },
          ],
        },
      ],
    };

    expect(() => validator.validate(input, context)).toThrow(
      'Property property-missing does not belong to database database-1',
    );
  });

  it('rejects an unknown parent block', () => {
    const input = {
      schemaVersion: 1,
      type: 'AI_MODIFICATION_PLAN',
      pageId: 'page-1',
      status: 'PLAN_READY',
      summary: 'Insert child block',
      operations: [
        {
          type: 'INSERT_BLOCKS',
          parentBlockId: 'block-missing',
          afterBlockId: null,
          blocks: [
            {
              type: PageBlockType.TEXT,
              content: {
                text: 'New child',
              },
            },
          ],
        },
      ],
    };

    expect(() => validator.validate(input, context)).toThrow(
      'Parent block block-missing is not available in the authorized AI page context',
    );
  });

  it('rejects a parent block that cannot contain children', () => {
    const input = {
      schemaVersion: 1,
      type: 'AI_MODIFICATION_PLAN',
      pageId: 'page-1',
      status: 'PLAN_READY',
      summary: 'Insert child block',
      operations: [
        {
          type: 'INSERT_BLOCKS',
          parentBlockId: 'block-root',
          afterBlockId: null,
          blocks: [
            {
              type: PageBlockType.TEXT,
              content: {
                text: 'New child',
              },
            },
          ],
        },
      ],
    };

    expect(() => validator.validate(input, context)).toThrow(
      'Parent block block-root cannot contain child blocks',
    );
  });

  it('rejects an unknown afterBlockId', () => {
    const input = {
      schemaVersion: 1,
      type: 'AI_MODIFICATION_PLAN',
      pageId: 'page-1',
      status: 'PLAN_READY',
      summary: 'Insert block',
      operations: [
        {
          type: 'INSERT_BLOCKS',
          parentBlockId: null,
          afterBlockId: 'block-missing',
          blocks: [
            {
              type: PageBlockType.TEXT,
              content: {
                text: 'New block',
              },
            },
          ],
        },
      ],
    };

    expect(() => validator.validate(input, context)).toThrow(
      'After block block-missing is not available in the authorized AI page context',
    );
  });

  it('rejects an unsupported block type', () => {
    const input = {
      schemaVersion: 1,
      type: 'AI_MODIFICATION_PLAN',
      pageId: 'page-1',
      status: 'PLAN_READY',
      summary: 'Insert unsupported block',
      operations: [
        {
          type: 'INSERT_BLOCKS',
          parentBlockId: null,
          afterBlockId: null,
          blocks: [
            {
              type: PageBlockType.DATABASE_VIEW,
              content: {
                text: 'Unsupported',
              },
            },
          ],
        },
      ],
    };

    expect(() => validator.validate(input, context)).toThrow(
      'Unsupported block type at operations[0].blocks[0]: DATABASE_VIEW',
    );
  });

  it('rejects TODO blocks with a non-boolean checked value', () => {
    const input = {
      schemaVersion: 1,
      type: 'AI_MODIFICATION_PLAN',
      pageId: 'page-1',
      status: 'PLAN_READY',
      summary: 'Insert todo',
      operations: [
        {
          type: 'INSERT_BLOCKS',
          parentBlockId: null,
          afterBlockId: null,
          blocks: [
            {
              type: PageBlockType.TODO,
              content: {
                text: 'Ship release',
                checked: 'false',
              },
            },
          ],
        },
      ],
    };

    expect(() => validator.validate(input, context)).toThrow(
      'operations[0].blocks[0].content.checked must be a boolean',
    );
  });

  it('rejects HEADER blocks with a non-integer level', () => {
    const input = {
      schemaVersion: 1,
      type: 'AI_MODIFICATION_PLAN',
      pageId: 'page-1',
      status: 'PLAN_READY',
      summary: 'Insert heading',
      operations: [
        {
          type: 'INSERT_BLOCKS',
          parentBlockId: null,
          afterBlockId: null,
          blocks: [
            {
              type: PageBlockType.HEADER,
              content: {
                text: 'Release',
              },
              styleConfig: {
                level: 1.5,
              },
            },
          ],
        },
      ],
    };

    expect(() => validator.validate(input, context)).toThrow(
      'operations[0].blocks[0].styleConfig.level must be an integer',
    );
  });
  it('rejects a MULTI_SELECT value that is not an array', () => {
    context.databases[0].properties.push({
      id: 'property-labels',
      name: 'Labels',
      type: PropertyType.MULTI_SELECT,
      position: '4',
      isDefault: false,
      isHideable: true,
      options: [
        {
          id: 'option-backend',
          name: 'Backend',
          color: 'blue',
          position: '0',
        },
      ],
    });

    const input = {
      schemaVersion: 1,
      type: 'AI_MODIFICATION_PLAN',
      pageId: 'page-1',
      status: 'PLAN_READY',
      summary: 'Add task',
      operations: [
        {
          type: 'CREATE_DATABASE_ROWS',
          databaseId: 'database-1',
          rows: [
            {
              values: {
                'property-title': 'Task',
                'property-labels': 'option-backend',
              },
            },
          ],
        },
      ],
    };

    expect(() => validator.validate(input, context)).toThrow(
      'operations[0].rows[0].values.property-labels must be an array of option IDs or null',
    );
  });

  it('rejects a MULTI_SELECT option that does not belong to the property', () => {
    context.databases[0].properties.push({
      id: 'property-labels',
      name: 'Labels',
      type: PropertyType.MULTI_SELECT,
      position: '4',
      isDefault: false,
      isHideable: true,
      options: [
        {
          id: 'option-backend',
          name: 'Backend',
          color: 'blue',
          position: '0',
        },
      ],
    });

    const input = {
      schemaVersion: 1,
      type: 'AI_MODIFICATION_PLAN',
      pageId: 'page-1',
      status: 'PLAN_READY',
      summary: 'Add task',
      operations: [
        {
          type: 'CREATE_DATABASE_ROWS',
          databaseId: 'database-1',
          rows: [
            {
              values: {
                'property-title': 'Task',
                'property-labels': ['option-missing'],
              },
            },
          ],
        },
      ],
    };

    expect(() => validator.validate(input, context)).toThrow(
      'Option option-missing does not belong to property property-labels',
    );
  });

  it('rejects a CHECKBOX value that is not boolean', () => {
    context.databases[0].properties.push({
      id: 'property-completed',
      name: 'Completed',
      type: PropertyType.CHECKBOX,
      position: '4',
      isDefault: false,
      isHideable: true,
      options: [],
    });

    const input = {
      schemaVersion: 1,
      type: 'AI_MODIFICATION_PLAN',
      pageId: 'page-1',
      status: 'PLAN_READY',
      summary: 'Add task',
      operations: [
        {
          type: 'CREATE_DATABASE_ROWS',
          databaseId: 'database-1',
          rows: [
            {
              values: {
                'property-title': 'Task',
                'property-completed': 'true',
              },
            },
          ],
        },
      ],
    };

    expect(() => validator.validate(input, context)).toThrow(
      'operations[0].rows[0].values.property-completed must be a boolean or null',
    );
  });

  it('rejects a DATE value with an empty start', () => {
    context.databases[0].properties.push({
      id: 'property-due-date',
      name: 'Due Date',
      type: PropertyType.DATE,
      position: '4',
      isDefault: false,
      isHideable: true,
      options: [],
    });

    const input = {
      schemaVersion: 1,
      type: 'AI_MODIFICATION_PLAN',
      pageId: 'page-1',
      status: 'PLAN_READY',
      summary: 'Add task',
      operations: [
        {
          type: 'CREATE_DATABASE_ROWS',
          databaseId: 'database-1',
          rows: [
            {
              values: {
                'property-title': 'Task',
                'property-due-date': {
                  start: '',
                },
              },
            },
          ],
        },
      ],
    };

    expect(() => validator.validate(input, context)).toThrow(
      'operations[0].rows[0].values.property-due-date.start must be a non-empty string',
    );
  });

  it('rejects a DATE value with an invalid end', () => {
    context.databases[0].properties.push({
      id: 'property-due-date',
      name: 'Due Date',
      type: PropertyType.DATE,
      position: '4',
      isDefault: false,
      isHideable: true,
      options: [],
    });

    const input = {
      schemaVersion: 1,
      type: 'AI_MODIFICATION_PLAN',
      pageId: 'page-1',
      status: 'PLAN_READY',
      summary: 'Add task',
      operations: [
        {
          type: 'CREATE_DATABASE_ROWS',
          databaseId: 'database-1',
          rows: [
            {
              values: {
                'property-title': 'Task',
                'property-due-date': {
                  start: '2026-10-08',
                  end: 123,
                },
              },
            },
          ],
        },
      ],
    };

    expect(() => validator.validate(input, context)).toThrow(
      'operations[0].rows[0].values.property-due-date.end must be a string, null, or omitted',
    );
  });

  it('rejects an unsupported context request reason', () => {
    const input = {
      schemaVersion: 1,
      type: 'AI_MODIFICATION_PLAN',
      pageId: 'page-1',
      status: 'NEED_MORE_CONTEXT',
      summary: 'More context required',
      operations: [],
      contextRequests: [
        {
          reason: 'UNKNOWN_REASON',
          description: 'Unknown context requirement.',
        },
      ],
    };

    expect(() => validator.validate(input, context)).toThrow(
      'Unsupported context request reason: UNKNOWN_REASON',
    );
  });

  it('rejects a context request that references an unknown database', () => {
    const input = {
      schemaVersion: 1,
      type: 'AI_MODIFICATION_PLAN',
      pageId: 'page-1',
      status: 'NEED_MORE_CONTEXT',
      summary: 'More context required',
      operations: [],
      contextRequests: [
        {
          reason: 'MISSING_RESOURCE_CONTEXT',
          description: 'Database context is required.',
          databaseId: 'database-missing',
        },
      ],
    };

    expect(() => validator.validate(input, context)).toThrow(
      'Context request database database-missing is not available in the authorized AI page context',
    );
  });

  it('rejects a context request that references an unknown block', () => {
    const input = {
      schemaVersion: 1,
      type: 'AI_MODIFICATION_PLAN',
      pageId: 'page-1',
      status: 'NEED_MORE_CONTEXT',
      summary: 'More context required',
      operations: [],
      contextRequests: [
        {
          reason: 'MISSING_RESOURCE_CONTEXT',
          description: 'Block context is required.',
          blockId: 'block-missing',
        },
      ],
    };

    expect(() => validator.validate(input, context)).toThrow(
      'Context request block block-missing is not available in the authorized AI page context',
    );
  });

  it('rejects ROWS_TRUNCATED without databaseId when no database rows are truncated', () => {
    const input = {
      schemaVersion: 1,
      type: 'AI_MODIFICATION_PLAN',
      pageId: 'page-1',
      status: 'NEED_MORE_CONTEXT',
      summary: 'More database rows are required',
      operations: [],
      contextRequests: [
        {
          reason: 'ROWS_TRUNCATED',
          description: 'More rows are required.',
        },
      ],
    };

    expect(() => validator.validate(input, context)).toThrow(
      'ROWS_TRUNCATED requires at least one database with truncated rows',
    );
  });
});
