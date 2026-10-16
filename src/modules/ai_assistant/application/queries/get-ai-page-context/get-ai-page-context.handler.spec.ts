import { BadRequestException } from '@nestjs/common';

import type { FindPageBlockByPageHandler } from 'src/modules/content/application/queries/page-block/find-page-block-by-page/find-page-block-by-page.handler';
import type { FindPageByIdHandler } from 'src/modules/content/application/queries/page/find-page-by-id/find-page-by-id.handler';
import { PageBlockType } from 'src/modules/content/domain/entities/page-block.entity';
import type { PageBlockRepository } from 'src/modules/content/domain/repositories/page-block.repository';

import type { GetDatabaseViewsHandler } from 'src/modules/database/application/queries/get-database-views/get-database-views.handler';
import { Database } from 'src/modules/database/domain/aggregates/database/database.aggregate';
import { DatabaseProperty } from 'src/modules/database/domain/aggregates/database/database-property.entity';
import { PropertyOption } from 'src/modules/database/domain/aggregates/database/property-option.entity';
import { DatabaseRow } from 'src/modules/database/domain/aggregates/row/database-row.aggregate';
import { RowValue } from 'src/modules/database/domain/aggregates/row/row-value.entity';
import { DatabaseViewType } from 'src/modules/database/domain/enums/database-view-type.enum';
import { PropertyType } from 'src/modules/database/domain/enums/property-type.enum';
import type { DatabaseRepository } from 'src/modules/database/domain/repositories/database.repository';
import type { DatabaseRowRepository } from 'src/modules/database/domain/repositories/database-row.repository';

import {
  MAX_AI_PAGE_CONTEXT_BLOCKS,
  MAX_AI_PAGE_CONTEXT_ROWS_PER_DATABASE,
  MAX_AI_PAGE_CONTEXT_TEXT_LENGTH,
} from '../../constants/ai-page-context.constant';
import { GetAiPageContextHandler } from './get-ai-page-context.handler';
import { GetAiPageContextQuery } from './get-ai-page-context.query';

describe('GetAiPageContextHandler', () => {
  it('builds structured page context from an authorized page', async () => {
    const page = {
      id: 'page-1',
      workspace_id: 'workspace-1',
      teamspace_id: null,
      parent_page_id: null,
      title: 'Release 1.0',
      icon: '🚀',
      cover_url: null,
      updatedAt: new Date('2026-10-05T08:00:00.000Z'),
    };

    const blocks = [
      {
        id: 'block-1',
        page_id: 'page-1',
        parent_block_id: null,
        type: PageBlockType.HEADER,
        title: null,
        order_index: 0,
        content: {
          text: 'Release checklist',
        },
        style_config: {
          level: 1,
        },
        data_config: null,
      },
      {
        id: 'block-2',
        page_id: 'page-1',
        parent_block_id: null,
        type: PageBlockType.DATABASE_VIEW,
        title: null,
        order_index: 1,
        content: null,
        style_config: null,
        data_config: {
          database_id: 'database-1',
          view_id: 'view-1',
        },
      },
    ];

    const statusTodo = new PropertyOption('option-todo', 'Todo', 'gray', '0');

    const statusDone = new PropertyOption('option-done', 'Done', 'green', '1');

    const titleProperty = new DatabaseProperty(
      'property-title',
      'database-1',
      'Name',
      PropertyType.TITLE,
      true,
      false,
      '0',
    );

    const statusProperty = new DatabaseProperty(
      'property-status',
      'database-1',
      'Status',
      PropertyType.STATUS,
      false,
      true,
      '1',
      [statusTodo, statusDone],
    );

    const database = Database.restore({
      id: 'database-1',
      pageId: 'page-1',
      name: 'Release Tasks',
      properties: [titleProperty, statusProperty],
    });

    const row = DatabaseRow.restore({
      id: 'row-1',
      databaseId: 'database-1',
      values: [
        new RowValue(
          'row-value-title',
          'row-1',
          'property-title',
          'Prepare release notes',
        ),
        new RowValue(
          'row-value-status',
          'row-1',
          'property-status',
          'option-todo',
        ),
      ],
    });

    const findPageByIdExecute = jest.fn().mockResolvedValue(page);
    const findPageBlocksExecute = jest.fn().mockResolvedValue(blocks);

    const countByPageId = jest.fn().mockResolvedValue(2);

    const findDatabasesByPageId = jest.fn().mockResolvedValue([database]);

    const findRowsByDatabaseId = jest.fn().mockResolvedValue([row]);
    const countRowsByDatabaseId = jest.fn().mockResolvedValue(1);

    const getDatabaseViewsExecute = jest.fn().mockResolvedValue([
      {
        id: 'view-1',
        databaseId: 'database-1',
        name: 'Table',
        type: DatabaseViewType.TABLE,
        position: '0',
        properties: [
          {
            id: 'view-property-title',
            propertyId: 'property-title',
            position: '0',
            visible: true,
            width: 280,
          },
          {
            id: 'view-property-status',
            propertyId: 'property-status',
            position: '1',
            visible: true,
            width: 180,
          },
        ],
      },
    ]);

    const handler = new GetAiPageContextHandler(
      {
        execute: findPageByIdExecute,
      } as unknown as FindPageByIdHandler,

      {
        execute: findPageBlocksExecute,
      } as unknown as FindPageBlockByPageHandler,

      {
        countByPageId,
      } as unknown as PageBlockRepository,

      {
        findByPageId: findDatabasesByPageId,
      } as unknown as DatabaseRepository,

      {
        findByDatabaseId: findRowsByDatabaseId,
        countByDatabaseId: countRowsByDatabaseId,
      } as unknown as DatabaseRowRepository,

      {
        execute: getDatabaseViewsExecute,
      } as unknown as GetDatabaseViewsHandler,
    );

    const result = await handler.execute(
      new GetAiPageContextQuery('user-1', 'page-1'),
    );

    expect(findPageByIdExecute).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        pageId: 'page-1',
      }),
    );

    expect(countByPageId).toHaveBeenCalledWith('page-1');

    expect(findPageBlocksExecute).toHaveBeenCalledWith(
      expect.objectContaining({
        pageId: 'page-1',
      }),
    );

    expect(findDatabasesByPageId).toHaveBeenCalledWith('page-1');

    expect(getDatabaseViewsExecute).toHaveBeenCalledWith(
      expect.objectContaining({
        databaseId: 'database-1',
      }),
    );

    expect(findRowsByDatabaseId).toHaveBeenCalledWith('database-1', undefined, {
      limit: MAX_AI_PAGE_CONTEXT_ROWS_PER_DATABASE,
    });

    expect(countRowsByDatabaseId).toHaveBeenCalledWith('database-1');

    expect(result.page).toEqual({
      id: 'page-1',
      workspaceId: 'workspace-1',
      teamspaceId: null,
      parentPageId: null,
      title: 'Release 1.0',
      icon: '🚀',
      coverUrl: null,
      updatedAt: '2026-10-05T08:00:00.000Z',
    });

    expect(result.blocks).toEqual([
      expect.objectContaining({
        id: 'block-1',
        parentBlockId: null,
        type: PageBlockType.HEADER,
        orderIndex: 0,
      }),
      expect.objectContaining({
        id: 'block-2',
        parentBlockId: null,
        type: PageBlockType.DATABASE_VIEW,
        orderIndex: 1,
      }),
    ]);

    expect(result.databaseReferences).toEqual([
      {
        blockId: 'block-2',
        databaseId: 'database-1',
        viewId: 'view-1',
      },
    ]);

    expect(result.databases).toEqual([
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
        ],

        views: [
          {
            id: 'view-1',
            databaseId: 'database-1',
            name: 'Table',
            type: DatabaseViewType.TABLE,
            position: '0',
            properties: [
              {
                propertyId: 'property-title',
                position: '0',
                visible: true,
                width: 280,
              },
              {
                propertyId: 'property-status',
                position: '1',
                visible: true,
                width: 180,
              },
            ],
          },
        ],

        rows: [
          {
            id: 'row-1',
            databaseId: 'database-1',
            values: {
              'property-title': 'Prepare release notes',
              'property-status': 'option-todo',
            },
          },
        ],
      },
    ]);

    expect(result.completeness).toEqual({
      blocks: {
        total: 2,
        included: 2,
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
          total: 1,
          included: 1,
          truncated: false,
          selection: 'BOUNDED',
        },
      ],

      textTruncated: false,
    });
  });

  it('rejects a database reference that does not belong to the target page', async () => {
    const page = {
      id: 'page-1',
      workspace_id: 'workspace-1',
      teamspace_id: null,
      parent_page_id: null,
      title: 'Release 1.0',
      icon: null,
      cover_url: null,
      updatedAt: new Date('2026-10-05T08:00:00.000Z'),
    };

    const blocks = [
      {
        id: 'block-1',
        page_id: 'page-1',
        parent_block_id: null,
        type: PageBlockType.DATABASE_VIEW,
        title: null,
        order_index: 0,
        content: null,
        style_config: null,
        data_config: {
          database_id: 'database-outside-page',
          view_id: 'view-1',
        },
      },
    ];

    const findPageByIdExecute = jest.fn().mockResolvedValue(page);
    const findPageBlocksExecute = jest.fn().mockResolvedValue(blocks);

    const countByPageId = jest.fn().mockResolvedValue(1);

    const findDatabasesByPageId = jest.fn().mockResolvedValue([]);

    const findRowsByDatabaseId = jest.fn();
    const countRowsByDatabaseId = jest.fn();

    const getDatabaseViewsExecute = jest.fn();

    const handler = new GetAiPageContextHandler(
      {
        execute: findPageByIdExecute,
      } as unknown as FindPageByIdHandler,

      {
        execute: findPageBlocksExecute,
      } as unknown as FindPageBlockByPageHandler,

      {
        countByPageId,
      } as unknown as PageBlockRepository,

      {
        findByPageId: findDatabasesByPageId,
      } as unknown as DatabaseRepository,

      {
        findByDatabaseId: findRowsByDatabaseId,
        countByDatabaseId: countRowsByDatabaseId,
      } as unknown as DatabaseRowRepository,

      {
        execute: getDatabaseViewsExecute,
      } as unknown as GetDatabaseViewsHandler,
    );

    await expect(
      handler.execute(new GetAiPageContextQuery('user-1', 'page-1')),
    ).rejects.toThrow(
      'Database database-outside-page referenced by this page does not belong to the target page',
    );

    expect(findDatabasesByPageId).toHaveBeenCalledWith('page-1');

    expect(getDatabaseViewsExecute).not.toHaveBeenCalled();
    expect(findRowsByDatabaseId).not.toHaveBeenCalled();
    expect(countRowsByDatabaseId).not.toHaveBeenCalled();
  });

  it('rejects a view reference that does not belong to the referenced database', async () => {
    const page = {
      id: 'page-1',
      workspace_id: 'workspace-1',
      teamspace_id: null,
      parent_page_id: null,
      title: 'Release 1.0',
      icon: null,
      cover_url: null,
      updatedAt: new Date('2026-10-05T08:00:00.000Z'),
    };

    const blocks = [
      {
        id: 'block-1',
        page_id: 'page-1',
        parent_block_id: null,
        type: PageBlockType.DATABASE_VIEW,
        title: null,
        order_index: 0,
        content: null,
        style_config: null,
        data_config: {
          database_id: 'database-1',
          view_id: 'view-outside-database',
        },
      },
    ];

    const titleProperty = new DatabaseProperty(
      'property-title',
      'database-1',
      'Name',
      PropertyType.TITLE,
      true,
      false,
      '0',
    );

    const database = Database.restore({
      id: 'database-1',
      pageId: 'page-1',
      name: 'Release Tasks',
      properties: [titleProperty],
    });

    const findPageByIdExecute = jest.fn().mockResolvedValue(page);
    const findPageBlocksExecute = jest.fn().mockResolvedValue(blocks);

    const countByPageId = jest.fn().mockResolvedValue(1);

    const findDatabasesByPageId = jest.fn().mockResolvedValue([database]);

    const findRowsByDatabaseId = jest.fn();
    const countRowsByDatabaseId = jest.fn();

    const getDatabaseViewsExecute = jest.fn().mockResolvedValue([
      {
        id: 'view-real',
        databaseId: 'database-1',
        name: 'Table',
        type: DatabaseViewType.TABLE,
        position: '0',
        properties: [],
      },
    ]);

    const handler = new GetAiPageContextHandler(
      {
        execute: findPageByIdExecute,
      } as unknown as FindPageByIdHandler,

      {
        execute: findPageBlocksExecute,
      } as unknown as FindPageBlockByPageHandler,

      {
        countByPageId,
      } as unknown as PageBlockRepository,

      {
        findByPageId: findDatabasesByPageId,
      } as unknown as DatabaseRepository,

      {
        findByDatabaseId: findRowsByDatabaseId,
        countByDatabaseId: countRowsByDatabaseId,
      } as unknown as DatabaseRowRepository,

      {
        execute: getDatabaseViewsExecute,
      } as unknown as GetDatabaseViewsHandler,
    );

    const execution = handler.execute(
      new GetAiPageContextQuery('user-1', 'page-1'),
    );

    await expect(execution).rejects.toBeInstanceOf(BadRequestException);

    await expect(execution).rejects.toThrow(
      'View view-outside-database does not belong to database database-1',
    );

    expect(findDatabasesByPageId).toHaveBeenCalledWith('page-1');

    expect(getDatabaseViewsExecute).toHaveBeenCalledWith(
      expect.objectContaining({
        databaseId: 'database-1',
      }),
    );

    expect(findRowsByDatabaseId).not.toHaveBeenCalled();
    expect(countRowsByDatabaseId).not.toHaveBeenCalled();
  });

  it('rejects the page before loading blocks when the block limit is exceeded', async () => {
    const page = {
      id: 'page-1',
      workspace_id: 'workspace-1',
      teamspace_id: null,
      parent_page_id: null,
      title: 'Large Page',
      icon: null,
      cover_url: null,
      updatedAt: new Date('2026-10-05T08:00:00.000Z'),
    };

    const findPageByIdExecute = jest.fn().mockResolvedValue(page);
    const findPageBlocksExecute = jest.fn();

    const countByPageId = jest
      .fn()
      .mockResolvedValue(MAX_AI_PAGE_CONTEXT_BLOCKS + 1);

    const findDatabasesByPageId = jest.fn();

    const findRowsByDatabaseId = jest.fn();
    const countRowsByDatabaseId = jest.fn();

    const getDatabaseViewsExecute = jest.fn();

    const handler = new GetAiPageContextHandler(
      {
        execute: findPageByIdExecute,
      } as unknown as FindPageByIdHandler,

      {
        execute: findPageBlocksExecute,
      } as unknown as FindPageBlockByPageHandler,

      {
        countByPageId,
      } as unknown as PageBlockRepository,

      {
        findByPageId: findDatabasesByPageId,
      } as unknown as DatabaseRepository,

      {
        findByDatabaseId: findRowsByDatabaseId,
        countByDatabaseId: countRowsByDatabaseId,
      } as unknown as DatabaseRowRepository,

      {
        execute: getDatabaseViewsExecute,
      } as unknown as GetDatabaseViewsHandler,
    );

    await expect(
      handler.execute(new GetAiPageContextQuery('user-1', 'page-1')),
    ).rejects.toThrow(
      `Page contains ${
        MAX_AI_PAGE_CONTEXT_BLOCKS + 1
      } blocks, exceeding AI context limit of ${MAX_AI_PAGE_CONTEXT_BLOCKS}`,
    );

    expect(findPageByIdExecute).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        pageId: 'page-1',
      }),
    );

    expect(countByPageId).toHaveBeenCalledWith('page-1');

    expect(findPageBlocksExecute).not.toHaveBeenCalled();

    expect(findDatabasesByPageId).not.toHaveBeenCalled();

    expect(getDatabaseViewsExecute).not.toHaveBeenCalled();

    expect(findRowsByDatabaseId).not.toHaveBeenCalled();
    expect(countRowsByDatabaseId).not.toHaveBeenCalled();
  });

  it('marks database rows as truncated when only a bounded subset is included', async () => {
    const page = {
      id: 'page-1',
      workspace_id: 'workspace-1',
      teamspace_id: null,
      parent_page_id: null,
      title: 'Release 1.0',
      icon: null,
      cover_url: null,
      updatedAt: new Date('2026-10-05T08:00:00.000Z'),
    };

    const blocks = [
      {
        id: 'block-1',
        page_id: 'page-1',
        parent_block_id: null,
        type: PageBlockType.DATABASE_VIEW,
        title: null,
        order_index: 0,
        content: null,
        style_config: null,
        data_config: {
          database_id: 'database-1',
          view_id: 'view-1',
        },
      },
    ];

    const titleProperty = new DatabaseProperty(
      'property-title',
      'database-1',
      'Name',
      PropertyType.TITLE,
      true,
      false,
      '0',
    );

    const database = Database.restore({
      id: 'database-1',
      pageId: 'page-1',
      name: 'Release Tasks',
      properties: [titleProperty],
    });

    const rows = Array.from(
      { length: MAX_AI_PAGE_CONTEXT_ROWS_PER_DATABASE },
      (_, index) =>
        DatabaseRow.restore({
          id: `row-${index + 1}`,
          databaseId: 'database-1',
          values: [
            new RowValue(
              `row-value-${index + 1}`,
              `row-${index + 1}`,
              'property-title',
              `Task ${index + 1}`,
            ),
          ],
        }),
    );

    const findPageByIdExecute = jest.fn().mockResolvedValue(page);
    const findPageBlocksExecute = jest.fn().mockResolvedValue(blocks);

    const countByPageId = jest.fn().mockResolvedValue(1);

    const findDatabasesByPageId = jest.fn().mockResolvedValue([database]);

    const findRowsByDatabaseId = jest.fn().mockResolvedValue(rows);

    const totalRows = MAX_AI_PAGE_CONTEXT_ROWS_PER_DATABASE + 25;

    const countRowsByDatabaseId = jest.fn().mockResolvedValue(totalRows);

    const getDatabaseViewsExecute = jest.fn().mockResolvedValue([
      {
        id: 'view-1',
        databaseId: 'database-1',
        name: 'Table',
        type: DatabaseViewType.TABLE,
        position: '0',
        properties: [
          {
            id: 'view-property-title',
            propertyId: 'property-title',
            position: '0',
            visible: true,
            width: 280,
          },
        ],
      },
    ]);

    const handler = new GetAiPageContextHandler(
      {
        execute: findPageByIdExecute,
      } as unknown as FindPageByIdHandler,

      {
        execute: findPageBlocksExecute,
      } as unknown as FindPageBlockByPageHandler,

      {
        countByPageId,
      } as unknown as PageBlockRepository,

      {
        findByPageId: findDatabasesByPageId,
      } as unknown as DatabaseRepository,

      {
        findByDatabaseId: findRowsByDatabaseId,
        countByDatabaseId: countRowsByDatabaseId,
      } as unknown as DatabaseRowRepository,

      {
        execute: getDatabaseViewsExecute,
      } as unknown as GetDatabaseViewsHandler,
    );

    const result = await handler.execute(
      new GetAiPageContextQuery('user-1', 'page-1'),
    );

    expect(findRowsByDatabaseId).toHaveBeenCalledWith('database-1', undefined, {
      limit: MAX_AI_PAGE_CONTEXT_ROWS_PER_DATABASE,
    });

    expect(countRowsByDatabaseId).toHaveBeenCalledWith('database-1');

    expect(result.databases).toHaveLength(1);

    expect(result.databases[0].rows).toHaveLength(
      MAX_AI_PAGE_CONTEXT_ROWS_PER_DATABASE,
    );

    expect(result.completeness.rows).toEqual([
      {
        databaseId: 'database-1',
        total: totalRows,
        included: MAX_AI_PAGE_CONTEXT_ROWS_PER_DATABASE,
        truncated: true,
        selection: 'BOUNDED',
      },
    ]);
  });

  it('truncates oversized block text and marks the context as text truncated', async () => {
    const page = {
      id: 'page-1',
      workspace_id: 'workspace-1',
      teamspace_id: null,
      parent_page_id: null,
      title: 'Large Content Page',
      icon: null,
      cover_url: null,
      updatedAt: new Date('2026-10-05T08:00:00.000Z'),
    };

    const longText = 'a'.repeat(MAX_AI_PAGE_CONTEXT_TEXT_LENGTH + 100);

    const blocks = [
      {
        id: 'block-1',
        page_id: 'page-1',
        parent_block_id: null,
        type: PageBlockType.TEXT,
        title: null,
        order_index: 0,
        content: {
          text: longText,
        },
        style_config: null,
        data_config: null,
      },
    ];

    const findPageByIdExecute = jest.fn().mockResolvedValue(page);
    const findPageBlocksExecute = jest.fn().mockResolvedValue(blocks);

    const countByPageId = jest.fn().mockResolvedValue(1);

    const findDatabasesByPageId = jest.fn().mockResolvedValue([]);

    const findRowsByDatabaseId = jest.fn();
    const countRowsByDatabaseId = jest.fn();

    const getDatabaseViewsExecute = jest.fn();

    const handler = new GetAiPageContextHandler(
      {
        execute: findPageByIdExecute,
      } as unknown as FindPageByIdHandler,

      {
        execute: findPageBlocksExecute,
      } as unknown as FindPageBlockByPageHandler,

      {
        countByPageId,
      } as unknown as PageBlockRepository,

      {
        findByPageId: findDatabasesByPageId,
      } as unknown as DatabaseRepository,

      {
        findByDatabaseId: findRowsByDatabaseId,
        countByDatabaseId: countRowsByDatabaseId,
      } as unknown as DatabaseRowRepository,

      {
        execute: getDatabaseViewsExecute,
      } as unknown as GetDatabaseViewsHandler,
    );

    const result = await handler.execute(
      new GetAiPageContextQuery('user-1', 'page-1'),
    );

    expect(findDatabasesByPageId).toHaveBeenCalledWith('page-1');

    expect(result.blocks).toHaveLength(1);

    expect(result.blocks[0].content).toEqual({
      text: 'a'.repeat(MAX_AI_PAGE_CONTEXT_TEXT_LENGTH),
    });

    expect((result.blocks[0].content as { text: string }).text).toHaveLength(
      MAX_AI_PAGE_CONTEXT_TEXT_LENGTH,
    );

    expect(result.completeness.textTruncated).toBe(true);

    expect(result.completeness.blocks).toEqual({
      total: 1,
      included: 1,
      truncated: false,
    });

    expect(result.databases).toEqual([]);
    expect(result.databaseReferences).toEqual([]);

    expect(getDatabaseViewsExecute).not.toHaveBeenCalled();
    expect(findRowsByDatabaseId).not.toHaveBeenCalled();
    expect(countRowsByDatabaseId).not.toHaveBeenCalled();
  });
});
