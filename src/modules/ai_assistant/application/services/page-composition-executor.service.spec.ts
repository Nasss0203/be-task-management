import type { AddDatabaseViewToBlockHandler } from 'src/modules/content/application/commands/page-block/add-database-view-to-block/add-database-view-to-block.handler';
import type { CreatePageBlockHandler } from 'src/modules/content/application/commands/page-block/create-page-block/create-page-block.handler';
import type { CreatePageHandler } from 'src/modules/content/application/commands/page/create-page/create-page.handler';
import { PageBlockType } from 'src/modules/content/domain/entities/page-block.entity';

import type { AddPropertyOptionHandler } from 'src/modules/database/application/commands/add-property-option/add-property-option.handler';
import type { AddPropertyHandler } from 'src/modules/database/application/commands/add-property/add-property.handler';
import type { CreateDatabaseRowHandler } from 'src/modules/database/application/commands/create-database-row/create-database-row.handler';
import type { CreateDatabaseHandler } from 'src/modules/database/application/commands/create-database/create-database.handler';
import type { CreateDatabaseViewHandler } from 'src/modules/database/application/commands/create-database-view/create-database-view.handler';
import type { RenamePropertyHandler } from 'src/modules/database/application/commands/rename-property/rename-property.handler';
import type { SetRowValueHandler } from 'src/modules/database/application/commands/set-row-value/set-row-value.handler';
import { DatabaseViewType } from 'src/modules/database/domain/enums/database-view-type.enum';
import { PropertyType } from 'src/modules/database/domain/enums/property-type.enum';

import type { UnitOfWork } from 'src/shared/infrastructure/persistence/unit-of-work.interface';

import { PAGE_COMPOSITION_SCHEMA_VERSION } from '../types/page-composition-draft';
import { PageCompositionExecutor } from './page-composition-executor.service';

function createFixture() {
  const createPageExecute = jest.fn().mockResolvedValue({
    id: 'page-1',
  });

  let blockSequence = 0;

  const createPageBlockExecute = jest.fn().mockImplementation(() => {
    blockSequence += 1;

    return Promise.resolve({
      id: `block-${blockSequence}`,
    });
  });

  const addDatabaseViewToBlockExecute = jest.fn();

  const createDatabaseExecute = jest.fn();

  const renamePropertyExecute = jest.fn();

  const addPropertyExecute = jest.fn();

  const addPropertyOptionExecute = jest.fn();

  const createDatabaseViewExecute = jest.fn();

  const createDatabaseRowExecute = jest.fn();

  const setRowValueExecute = jest.fn();

  const context = {};

  const runInTransaction = jest.fn(
    async (callback: (context: unknown) => Promise<unknown>) =>
      await callback(context),
  );

  const executor = new PageCompositionExecutor(
    {
      execute: createPageExecute,
    } as unknown as CreatePageHandler,

    {
      execute: createPageBlockExecute,
    } as unknown as CreatePageBlockHandler,

    {
      execute: addDatabaseViewToBlockExecute,
    } as unknown as AddDatabaseViewToBlockHandler,

    {
      execute: createDatabaseExecute,
    } as unknown as CreateDatabaseHandler,

    {
      execute: renamePropertyExecute,
    } as unknown as RenamePropertyHandler,

    {
      execute: addPropertyExecute,
    } as unknown as AddPropertyHandler,

    {
      execute: addPropertyOptionExecute,
    } as unknown as AddPropertyOptionHandler,

    {
      execute: createDatabaseViewExecute,
    } as unknown as CreateDatabaseViewHandler,

    {
      execute: createDatabaseRowExecute,
    } as unknown as CreateDatabaseRowHandler,

    {
      execute: setRowValueExecute,
    } as unknown as SetRowValueHandler,

    {
      runInTransaction,
    } as unknown as UnitOfWork,
  );

  return {
    executor,
    context,
    createPageExecute,
    createPageBlockExecute,
    addDatabaseViewToBlockExecute,
    createDatabaseExecute,
    renamePropertyExecute,
    addPropertyExecute,
    addPropertyOptionExecute,
    createDatabaseViewExecute,
    createDatabaseRowExecute,
    setRowValueExecute,
    runInTransaction,
  };
}

describe('PageCompositionExecutor', () => {
  it('creates the page from the page composition draft', async () => {
    const fixture = createFixture();

    const result = await fixture.executor.execute({
      userId: 'user-1',
      workspaceId: 'workspace-1',
      teamspaceId: 'teamspace-1',
      parentPageId: 'parent-page-1',
      draft: {
        schemaVersion: PAGE_COMPOSITION_SCHEMA_VERSION,
        type: 'PAGE_COMPOSITION',
        page: {
          title: 'Sprint Planning',
          icon: '📌',
          coverUrl: 'https://example.com/cover.png',
        },
        blocks: [],
        databases: [],
      },
    });

    expect(fixture.runInTransaction).toHaveBeenCalledTimes(1);
    expect(fixture.createPageExecute).toHaveBeenCalledTimes(1);

    const [command, context] = fixture.createPageExecute.mock.calls[0];

    expect(command.userId).toBe('user-1');
    expect(command.workspaceId).toBe('workspace-1');
    expect(command.title).toBe('Sprint Planning');
    expect(command.teamspaceId).toBe('teamspace-1');
    expect(command.parentPageId).toBe('parent-page-1');
    expect(command.icon).toBe('📌');
    expect(command.coverUrl).toBe('https://example.com/cover.png');

    expect(context).toBe(fixture.context);

    expect(result).toEqual({
      pageId: 'page-1',
      blockIds: {},
      databaseIds: {},
      propertyIds: {},
      optionIds: {},
      viewIds: {},
      rowIds: {},
    });

    expect(fixture.createPageBlockExecute).not.toHaveBeenCalled();

    expect(fixture.addDatabaseViewToBlockExecute).not.toHaveBeenCalled();

    expect(fixture.createDatabaseExecute).not.toHaveBeenCalled();

    expect(fixture.renamePropertyExecute).not.toHaveBeenCalled();

    expect(fixture.addPropertyExecute).not.toHaveBeenCalled();

    expect(fixture.addPropertyOptionExecute).not.toHaveBeenCalled();

    expect(fixture.createDatabaseViewExecute).not.toHaveBeenCalled();

    expect(fixture.createDatabaseRowExecute).not.toHaveBeenCalled();

    expect(fixture.setRowValueExecute).not.toHaveBeenCalled();
  });

  it('creates a parent block before its child even when the child appears first in the draft', async () => {
    const fixture = createFixture();

    const result = await fixture.executor.execute({
      userId: 'user-1',
      workspaceId: 'workspace-1',
      draft: {
        schemaVersion: PAGE_COMPOSITION_SCHEMA_VERSION,
        type: 'PAGE_COMPOSITION',
        page: {
          title: 'Nested Blocks',
        },
        blocks: [
          {
            ref: 'child-text',
            parentRef: 'parent-toggle',
            type: PageBlockType.TEXT,
            content: {
              text: 'Child',
            },
          },
          {
            ref: 'parent-toggle',
            type: PageBlockType.TOGGLE,
            content: {
              text: 'Parent',
            },
          },
        ],
        databases: [],
      },
    });

    expect(fixture.createPageBlockExecute).toHaveBeenCalledTimes(2);

    const firstCommand = fixture.createPageBlockExecute.mock.calls[0][0];

    const secondCommand = fixture.createPageBlockExecute.mock.calls[1][0];

    expect(firstCommand.input).toEqual(
      expect.objectContaining({
        pageId: 'page-1',
        parentBlockId: null,
        afterBlockId: null,
        type: PageBlockType.TOGGLE,
        createdBy: 'user-1',
        content: {
          text: 'Parent',
        },
      }),
    );

    expect(secondCommand.input).toEqual(
      expect.objectContaining({
        pageId: 'page-1',
        parentBlockId: 'block-1',
        afterBlockId: null,
        type: PageBlockType.TEXT,
        createdBy: 'user-1',
        content: {
          text: 'Child',
        },
      }),
    );

    expect(result.blockIds).toEqual({
      'parent-toggle': 'block-1',
      'child-text': 'block-2',
    });

    expect(result.databaseIds).toEqual({});
    expect(result.propertyIds).toEqual({});
    expect(result.optionIds).toEqual({});
    expect(result.viewIds).toEqual({});
    expect(result.rowIds).toEqual({});

    expect(fixture.addDatabaseViewToBlockExecute).not.toHaveBeenCalled();
  });

  it('creates siblings by orderIndex and chains afterBlockId', async () => {
    const fixture = createFixture();

    const result = await fixture.executor.execute({
      userId: 'user-1',
      workspaceId: 'workspace-1',
      draft: {
        schemaVersion: PAGE_COMPOSITION_SCHEMA_VERSION,
        type: 'PAGE_COMPOSITION',
        page: {
          title: 'Ordered Blocks',
        },
        blocks: [
          {
            ref: 'third',
            orderIndex: 2,
            type: PageBlockType.TEXT,
            content: {
              text: 'Third',
            },
          },
          {
            ref: 'first',
            orderIndex: 0,
            type: PageBlockType.HEADER,
            content: {
              text: 'First',
            },
            styleConfig: {
              level: 1,
            },
          },
          {
            ref: 'second',
            orderIndex: 1,
            type: PageBlockType.QUOTE,
            content: {
              text: 'Second',
            },
          },
        ],
        databases: [],
      },
    });

    expect(fixture.createPageBlockExecute).toHaveBeenCalledTimes(3);

    const firstCommand = fixture.createPageBlockExecute.mock.calls[0][0];

    const secondCommand = fixture.createPageBlockExecute.mock.calls[1][0];

    const thirdCommand = fixture.createPageBlockExecute.mock.calls[2][0];

    expect(firstCommand.input).toEqual(
      expect.objectContaining({
        parentBlockId: null,
        afterBlockId: null,
        type: PageBlockType.HEADER,
        content: {
          text: 'First',
        },
        styleConfig: {
          level: 1,
        },
      }),
    );

    expect(secondCommand.input).toEqual(
      expect.objectContaining({
        parentBlockId: null,
        afterBlockId: 'block-1',
        type: PageBlockType.QUOTE,
        content: {
          text: 'Second',
        },
      }),
    );

    expect(thirdCommand.input).toEqual(
      expect.objectContaining({
        parentBlockId: null,
        afterBlockId: 'block-2',
        type: PageBlockType.TEXT,
        content: {
          text: 'Third',
        },
      }),
    );

    expect(result.blockIds).toEqual({
      first: 'block-1',
      second: 'block-2',
      third: 'block-3',
    });

    expect(result.databaseIds).toEqual({});
    expect(result.propertyIds).toEqual({});
    expect(result.optionIds).toEqual({});
    expect(result.viewIds).toEqual({});
    expect(result.rowIds).toEqual({});

    expect(fixture.addDatabaseViewToBlockExecute).not.toHaveBeenCalled();
  });

  it('maps the draft TITLE to the default database TITLE and renames it when needed', async () => {
    const fixture = createFixture();

    const defaultTitleProperty = {
      getId: jest.fn().mockReturnValue('property-title-1'),
      getType: jest.fn().mockReturnValue(PropertyType.TITLE),
      getName: jest.fn().mockReturnValue('Name'),
    };

    const database = {
      getId: jest.fn().mockReturnValue('database-1'),
      getProperties: jest.fn().mockReturnValue([defaultTitleProperty]),
    };

    fixture.createDatabaseExecute.mockResolvedValue(database);

    const result = await fixture.executor.execute({
      userId: 'user-1',
      workspaceId: 'workspace-1',
      draft: {
        schemaVersion: PAGE_COMPOSITION_SCHEMA_VERSION,
        type: 'PAGE_COMPOSITION',
        page: {
          title: 'Sprint Planning',
        },
        blocks: [],
        databases: [
          {
            ref: 'tasks-db',
            name: 'Tasks',
            properties: [
              {
                ref: 'task-title',
                name: 'Task',
                type: PropertyType.TITLE,
              },
            ],
            views: [],
            rows: [],
          },
        ],
      },
    });

    expect(fixture.createDatabaseExecute).toHaveBeenCalledTimes(1);

    const [createDatabaseCommand, createDatabaseContext] =
      fixture.createDatabaseExecute.mock.calls[0];

    expect(createDatabaseCommand.pageId).toBe('page-1');
    expect(createDatabaseCommand.name).toBe('Tasks');
    expect(createDatabaseContext).toBe(fixture.context);

    expect(fixture.renamePropertyExecute).toHaveBeenCalledTimes(1);

    const [renameCommand, renameContext] =
      fixture.renamePropertyExecute.mock.calls[0];

    expect(renameCommand.databaseId).toBe('database-1');
    expect(renameCommand.propertyId).toBe('property-title-1');
    expect(renameCommand.name).toBe('Task');
    expect(renameContext).toBe(fixture.context);

    expect(fixture.addPropertyExecute).not.toHaveBeenCalled();

    expect(fixture.addPropertyOptionExecute).not.toHaveBeenCalled();

    expect(fixture.createDatabaseViewExecute).not.toHaveBeenCalled();

    expect(fixture.createDatabaseRowExecute).not.toHaveBeenCalled();

    expect(fixture.setRowValueExecute).not.toHaveBeenCalled();

    expect(fixture.addDatabaseViewToBlockExecute).not.toHaveBeenCalled();

    expect(result.databaseIds).toEqual({
      'tasks-db': 'database-1',
    });

    expect(result.propertyIds).toEqual({
      'task-title': 'property-title-1',
    });

    expect(result.optionIds).toEqual({});

    expect(result.viewIds).toEqual({
      'tasks-db': {},
    });

    expect(result.rowIds).toEqual({
      'tasks-db': {},
    });
  });

  it('creates non-TITLE database properties and maps their logical refs to real ids', async () => {
    const fixture = createFixture();

    const defaultTitleProperty = {
      getId: jest.fn().mockReturnValue('property-title-1'),
      getType: jest.fn().mockReturnValue(PropertyType.TITLE),
      getName: jest.fn().mockReturnValue('Name'),
    };

    const database = {
      getId: jest.fn().mockReturnValue('database-1'),
      getProperties: jest.fn().mockReturnValue([defaultTitleProperty]),
    };

    fixture.createDatabaseExecute.mockResolvedValue(database);

    fixture.addPropertyExecute
      .mockResolvedValueOnce({
        id: 'property-text-1',
      })
      .mockResolvedValueOnce({
        id: 'property-number-1',
      })
      .mockResolvedValueOnce({
        id: 'property-select-1',
      })
      .mockResolvedValueOnce({
        id: 'property-checkbox-1',
      })
      .mockResolvedValueOnce({
        id: 'property-date-1',
      });

    const result = await fixture.executor.execute({
      userId: 'user-1',
      workspaceId: 'workspace-1',
      draft: {
        schemaVersion: PAGE_COMPOSITION_SCHEMA_VERSION,
        type: 'PAGE_COMPOSITION',
        page: {
          title: 'Tasks',
        },
        blocks: [],
        databases: [
          {
            ref: 'tasks-db',
            name: 'Tasks',
            properties: [
              {
                ref: 'task-title',
                name: 'Name',
                type: PropertyType.TITLE,
              },
              {
                ref: 'description',
                name: 'Description',
                type: PropertyType.TEXT,
              },
              {
                ref: 'estimate',
                name: 'Estimate',
                type: PropertyType.NUMBER,
              },
              {
                ref: 'priority',
                name: 'Priority',
                type: PropertyType.SELECT,
                options: [],
              },
              {
                ref: 'completed',
                name: 'Completed',
                type: PropertyType.CHECKBOX,
              },
              {
                ref: 'start-date',
                name: 'Start date',
                type: PropertyType.DATE,
              },
            ],
            views: [],
            rows: [],
          },
        ],
      },
    });

    expect(fixture.renamePropertyExecute).not.toHaveBeenCalled();

    expect(fixture.addPropertyExecute).toHaveBeenCalledTimes(5);

    expect(fixture.addPropertyOptionExecute).not.toHaveBeenCalled();

    expect(fixture.createDatabaseViewExecute).not.toHaveBeenCalled();

    expect(fixture.createDatabaseRowExecute).not.toHaveBeenCalled();

    expect(fixture.setRowValueExecute).not.toHaveBeenCalled();

    expect(fixture.addDatabaseViewToBlockExecute).not.toHaveBeenCalled();

    const propertyCommands = fixture.addPropertyExecute.mock.calls.map(
      ([command]) => ({
        databaseId: command.databaseId,
        name: command.name,
        type: command.type,
      }),
    );

    expect(propertyCommands).toEqual([
      {
        databaseId: 'database-1',
        name: 'Description',
        type: PropertyType.TEXT,
      },
      {
        databaseId: 'database-1',
        name: 'Estimate',
        type: PropertyType.NUMBER,
      },
      {
        databaseId: 'database-1',
        name: 'Priority',
        type: PropertyType.SELECT,
      },
      {
        databaseId: 'database-1',
        name: 'Completed',
        type: PropertyType.CHECKBOX,
      },
      {
        databaseId: 'database-1',
        name: 'Start date',
        type: PropertyType.DATE,
      },
    ]);

    for (const [, context] of fixture.addPropertyExecute.mock.calls) {
      expect(context).toBe(fixture.context);
    }

    expect(result.databaseIds).toEqual({
      'tasks-db': 'database-1',
    });

    expect(result.propertyIds).toEqual({
      'task-title': 'property-title-1',
      description: 'property-text-1',
      estimate: 'property-number-1',
      priority: 'property-select-1',
      completed: 'property-checkbox-1',
      'start-date': 'property-date-1',
    });

    expect(result.optionIds).toEqual({
      priority: {},
    });

    expect(result.viewIds).toEqual({
      'tasks-db': {},
    });

    expect(result.rowIds).toEqual({
      'tasks-db': {},
    });
  });

  it('creates SELECT options and maps option refs to real ids', async () => {
    const fixture = createFixture();

    const defaultTitleProperty = {
      getId: jest.fn().mockReturnValue('property-title-1'),
      getType: jest.fn().mockReturnValue(PropertyType.TITLE),
      getName: jest.fn().mockReturnValue('Name'),
    };

    const database = {
      getId: jest.fn().mockReturnValue('database-1'),
      getProperties: jest.fn().mockReturnValue([defaultTitleProperty]),
    };

    fixture.createDatabaseExecute.mockResolvedValue(database);

    fixture.addPropertyExecute.mockResolvedValue({
      id: 'property-priority-1',
    });

    fixture.addPropertyOptionExecute
      .mockResolvedValueOnce({
        getId: jest.fn().mockReturnValue('option-low-1'),
      })
      .mockResolvedValueOnce({
        getId: jest.fn().mockReturnValue('option-high-1'),
      });

    const result = await fixture.executor.execute({
      userId: 'user-1',
      workspaceId: 'workspace-1',
      draft: {
        schemaVersion: PAGE_COMPOSITION_SCHEMA_VERSION,
        type: 'PAGE_COMPOSITION',
        page: {
          title: 'Tasks',
        },
        blocks: [],
        databases: [
          {
            ref: 'tasks-db',
            name: 'Tasks',
            properties: [
              {
                ref: 'task-title',
                name: 'Name',
                type: PropertyType.TITLE,
              },
              {
                ref: 'priority',
                name: 'Priority',
                type: PropertyType.SELECT,
                options: [
                  {
                    ref: 'low',
                    name: 'Low',
                    color: 'green',
                  },
                  {
                    ref: 'high',
                    name: 'High',
                    color: 'red',
                  },
                ],
              },
            ],
            views: [],
            rows: [],
          },
        ],
      },
    });

    expect(fixture.addPropertyExecute).toHaveBeenCalledTimes(1);

    expect(fixture.addPropertyOptionExecute).toHaveBeenCalledTimes(2);

    expect(fixture.createDatabaseViewExecute).not.toHaveBeenCalled();

    expect(fixture.createDatabaseRowExecute).not.toHaveBeenCalled();

    expect(fixture.setRowValueExecute).not.toHaveBeenCalled();

    expect(fixture.addDatabaseViewToBlockExecute).not.toHaveBeenCalled();

    const [lowCommand, lowContext] =
      fixture.addPropertyOptionExecute.mock.calls[0];

    expect(lowCommand.databaseId).toBe('database-1');
    expect(lowCommand.propertyId).toBe('property-priority-1');
    expect(lowCommand.name).toBe('Low');
    expect(lowCommand.color).toBe('green');
    expect(lowContext).toBe(fixture.context);

    const [highCommand, highContext] =
      fixture.addPropertyOptionExecute.mock.calls[1];

    expect(highCommand.databaseId).toBe('database-1');
    expect(highCommand.propertyId).toBe('property-priority-1');
    expect(highCommand.name).toBe('High');
    expect(highCommand.color).toBe('red');
    expect(highContext).toBe(fixture.context);

    expect(result.databaseIds).toEqual({
      'tasks-db': 'database-1',
    });

    expect(result.propertyIds).toEqual({
      'task-title': 'property-title-1',
      priority: 'property-priority-1',
    });

    expect(result.optionIds).toEqual({
      priority: {
        low: 'option-low-1',
        high: 'option-high-1',
      },
    });

    expect(result.viewIds).toEqual({
      'tasks-db': {},
    });

    expect(result.rowIds).toEqual({
      'tasks-db': {},
    });
  });

  it('creates database views and maps view refs to real ids', async () => {
    const fixture = createFixture();

    const defaultTitleProperty = {
      getId: jest.fn().mockReturnValue('property-title-1'),
      getType: jest.fn().mockReturnValue(PropertyType.TITLE),
      getName: jest.fn().mockReturnValue('Name'),
    };

    const database = {
      getId: jest.fn().mockReturnValue('database-1'),
      getProperties: jest.fn().mockReturnValue([defaultTitleProperty]),
    };

    fixture.createDatabaseExecute.mockResolvedValue(database);

    fixture.createDatabaseViewExecute.mockResolvedValue({
      id: 'view-table-1',
      databaseId: 'database-1',
      name: 'All Tasks',
      type: DatabaseViewType.TABLE,
      position: '0',
    });

    const result = await fixture.executor.execute({
      userId: 'user-1',
      workspaceId: 'workspace-1',
      draft: {
        schemaVersion: PAGE_COMPOSITION_SCHEMA_VERSION,
        type: 'PAGE_COMPOSITION',
        page: {
          title: 'Task Board',
        },
        blocks: [],
        databases: [
          {
            ref: 'tasks-db',
            name: 'Tasks',
            properties: [
              {
                ref: 'task-title',
                name: 'Name',
                type: PropertyType.TITLE,
              },
            ],
            views: [
              {
                ref: 'all-tasks',
                name: 'All Tasks',
                type: DatabaseViewType.TABLE,
              },
            ],
            rows: [],
          },
        ],
      },
    });

    expect(fixture.createDatabaseViewExecute).toHaveBeenCalledTimes(1);

    const [viewCommand, viewContext] =
      fixture.createDatabaseViewExecute.mock.calls[0];

    expect(viewCommand.databaseId).toBe('database-1');
    expect(viewCommand.name).toBe('All Tasks');
    expect(viewCommand.type).toBe(DatabaseViewType.TABLE);
    expect(viewContext).toBe(fixture.context);

    expect(fixture.createDatabaseRowExecute).not.toHaveBeenCalled();

    expect(fixture.setRowValueExecute).not.toHaveBeenCalled();

    expect(fixture.addDatabaseViewToBlockExecute).not.toHaveBeenCalled();

    expect(result.databaseIds).toEqual({
      'tasks-db': 'database-1',
    });

    expect(result.viewIds).toEqual({
      'tasks-db': {
        'all-tasks': 'view-table-1',
      },
    });

    expect(result.rowIds).toEqual({
      'tasks-db': {},
    });
  });

  it('creates database rows, maps row refs, and sets primitive row values', async () => {
    const fixture = createFixture();

    const defaultTitleProperty = {
      getId: jest.fn().mockReturnValue('property-title-1'),
      getType: jest.fn().mockReturnValue(PropertyType.TITLE),
      getName: jest.fn().mockReturnValue('Name'),
    };

    const database = {
      getId: jest.fn().mockReturnValue('database-1'),
      getProperties: jest.fn().mockReturnValue([defaultTitleProperty]),
    };

    fixture.createDatabaseExecute.mockResolvedValue(database);

    fixture.addPropertyExecute
      .mockResolvedValueOnce({
        id: 'property-description-1',
      })
      .mockResolvedValueOnce({
        id: 'property-estimate-1',
      })
      .mockResolvedValueOnce({
        id: 'property-completed-1',
      })
      .mockResolvedValueOnce({
        id: 'property-date-1',
      });

    fixture.createDatabaseRowExecute.mockResolvedValue({
      getId: jest.fn().mockReturnValue('row-1'),
    });

    fixture.setRowValueExecute.mockResolvedValue({});

    const result = await fixture.executor.execute({
      userId: 'user-1',
      workspaceId: 'workspace-1',
      draft: {
        schemaVersion: PAGE_COMPOSITION_SCHEMA_VERSION,
        type: 'PAGE_COMPOSITION',
        page: {
          title: 'Tasks',
        },
        blocks: [],
        databases: [
          {
            ref: 'tasks-db',
            name: 'Tasks',
            properties: [
              {
                ref: 'task-title',
                name: 'Name',
                type: PropertyType.TITLE,
              },
              {
                ref: 'description',
                name: 'Description',
                type: PropertyType.TEXT,
              },
              {
                ref: 'estimate',
                name: 'Estimate',
                type: PropertyType.NUMBER,
              },
              {
                ref: 'completed',
                name: 'Completed',
                type: PropertyType.CHECKBOX,
              },
              {
                ref: 'start-date',
                name: 'Start date',
                type: PropertyType.DATE,
              },
            ],
            views: [],
            rows: [
              {
                ref: 'task-1',
                values: {
                  'task-title': 'Implement AI composition',
                  description: 'Create executor',
                  estimate: 8,
                  completed: false,
                  'start-date': {
                    start: '2026-09-30',
                    end: '2026-10-01',
                  },
                },
              },
            ],
          },
        ],
      },
    });

    expect(fixture.createDatabaseRowExecute).toHaveBeenCalledTimes(1);

    const [createRowCommand, createRowContext] =
      fixture.createDatabaseRowExecute.mock.calls[0];

    expect(createRowCommand.databaseId).toBe('database-1');
    expect(createRowContext).toBe(fixture.context);

    expect(fixture.setRowValueExecute).toHaveBeenCalledTimes(5);

    const rowValueCommands = fixture.setRowValueExecute.mock.calls.map(
      ([command]) => ({
        rowId: command.rowId,
        propertyId: command.propertyId,
        value: command.value,
      }),
    );

    expect(rowValueCommands).toEqual([
      {
        rowId: 'row-1',
        propertyId: 'property-title-1',
        value: 'Implement AI composition',
      },
      {
        rowId: 'row-1',
        propertyId: 'property-description-1',
        value: 'Create executor',
      },
      {
        rowId: 'row-1',
        propertyId: 'property-estimate-1',
        value: 8,
      },
      {
        rowId: 'row-1',
        propertyId: 'property-completed-1',
        value: false,
      },
      {
        rowId: 'row-1',
        propertyId: 'property-date-1',
        value: {
          start: '2026-09-30',
          end: '2026-10-01',
        },
      },
    ]);

    for (const [, context] of fixture.setRowValueExecute.mock.calls) {
      expect(context).toBe(fixture.context);
    }

    expect(fixture.addDatabaseViewToBlockExecute).not.toHaveBeenCalled();

    expect(result.rowIds).toEqual({
      'tasks-db': {
        'task-1': 'row-1',
      },
    });
  });

  it('resolves SELECT optionRef to the real option id before setting the row value', async () => {
    const fixture = createFixture();

    const defaultTitleProperty = {
      getId: jest.fn().mockReturnValue('property-title-1'),
      getType: jest.fn().mockReturnValue(PropertyType.TITLE),
      getName: jest.fn().mockReturnValue('Name'),
    };

    const database = {
      getId: jest.fn().mockReturnValue('database-1'),
      getProperties: jest.fn().mockReturnValue([defaultTitleProperty]),
    };

    fixture.createDatabaseExecute.mockResolvedValue(database);

    fixture.addPropertyExecute.mockResolvedValue({
      id: 'property-priority-1',
    });

    fixture.addPropertyOptionExecute
      .mockResolvedValueOnce({
        getId: jest.fn().mockReturnValue('option-low-1'),
      })
      .mockResolvedValueOnce({
        getId: jest.fn().mockReturnValue('option-high-1'),
      });

    fixture.createDatabaseRowExecute.mockResolvedValue({
      getId: jest.fn().mockReturnValue('row-1'),
    });

    fixture.setRowValueExecute.mockResolvedValue({});

    const result = await fixture.executor.execute({
      userId: 'user-1',
      workspaceId: 'workspace-1',
      draft: {
        schemaVersion: PAGE_COMPOSITION_SCHEMA_VERSION,
        type: 'PAGE_COMPOSITION',
        page: {
          title: 'Tasks',
        },
        blocks: [],
        databases: [
          {
            ref: 'tasks-db',
            name: 'Tasks',
            properties: [
              {
                ref: 'task-title',
                name: 'Name',
                type: PropertyType.TITLE,
              },
              {
                ref: 'priority',
                name: 'Priority',
                type: PropertyType.SELECT,
                options: [
                  {
                    ref: 'low',
                    name: 'Low',
                    color: 'green',
                  },
                  {
                    ref: 'high',
                    name: 'High',
                    color: 'red',
                  },
                ],
              },
            ],
            views: [],
            rows: [
              {
                ref: 'task-1',
                values: {
                  'task-title': 'Fix production bug',
                  priority: {
                    optionRef: 'high',
                  },
                },
              },
            ],
          },
        ],
      },
    });

    expect(fixture.createDatabaseRowExecute).toHaveBeenCalledTimes(1);

    expect(fixture.setRowValueExecute).toHaveBeenCalledTimes(2);

    const titleCommand = fixture.setRowValueExecute.mock.calls[0][0];

    expect(titleCommand.rowId).toBe('row-1');
    expect(titleCommand.propertyId).toBe('property-title-1');
    expect(titleCommand.value).toBe('Fix production bug');

    const priorityCommand = fixture.setRowValueExecute.mock.calls[1][0];

    expect(priorityCommand.rowId).toBe('row-1');
    expect(priorityCommand.propertyId).toBe('property-priority-1');

    expect(priorityCommand.value).toBe('option-high-1');

    expect(fixture.addDatabaseViewToBlockExecute).not.toHaveBeenCalled();

    expect(result.optionIds).toEqual({
      priority: {
        low: 'option-low-1',
        high: 'option-high-1',
      },
    });

    expect(result.rowIds).toEqual({
      'tasks-db': {
        'task-1': 'row-1',
      },
    });
  });

  it('attaches the resolved database and view ids to a DATABASE_VIEW block', async () => {
    const fixture = createFixture();

    const defaultTitleProperty = {
      getId: jest.fn().mockReturnValue('property-title-1'),
      getType: jest.fn().mockReturnValue(PropertyType.TITLE),
      getName: jest.fn().mockReturnValue('Name'),
    };

    const database = {
      getId: jest.fn().mockReturnValue('database-1'),
      getProperties: jest.fn().mockReturnValue([defaultTitleProperty]),
    };

    fixture.createDatabaseExecute.mockResolvedValue(database);

    fixture.createDatabaseViewExecute.mockResolvedValue({
      id: 'view-table-1',
      databaseId: 'database-1',
      name: 'All Tasks',
      type: DatabaseViewType.TABLE,
      position: '0',
    });

    fixture.addDatabaseViewToBlockExecute.mockResolvedValue({
      id: 'block-1',
    });

    const result = await fixture.executor.execute({
      userId: 'user-1',
      workspaceId: 'workspace-1',
      draft: {
        schemaVersion: PAGE_COMPOSITION_SCHEMA_VERSION,
        type: 'PAGE_COMPOSITION',
        page: {
          title: 'Task Board',
        },
        blocks: [
          {
            ref: 'tasks-table-block',
            type: PageBlockType.DATABASE_VIEW,
            databaseRef: 'tasks-db',
            viewRef: 'all-tasks',
          },
        ],
        databases: [
          {
            ref: 'tasks-db',
            name: 'Tasks',
            properties: [
              {
                ref: 'task-title',
                name: 'Name',
                type: PropertyType.TITLE,
              },
            ],
            views: [
              {
                ref: 'all-tasks',
                name: 'All Tasks',
                type: DatabaseViewType.TABLE,
              },
            ],
            rows: [],
          },
        ],
      },
    });

    expect(fixture.createPageBlockExecute).toHaveBeenCalledTimes(1);

    const blockCommand = fixture.createPageBlockExecute.mock.calls[0][0];

    expect(blockCommand.input).toEqual(
      expect.objectContaining({
        pageId: 'page-1',
        parentBlockId: null,
        afterBlockId: null,
        type: PageBlockType.DATABASE_VIEW,
        createdBy: 'user-1',
      }),
    );

    expect(fixture.createDatabaseViewExecute).toHaveBeenCalledTimes(1);

    expect(fixture.addDatabaseViewToBlockExecute).toHaveBeenCalledTimes(1);

    const [attachCommand] = fixture.addDatabaseViewToBlockExecute.mock.calls[0];

    expect(attachCommand.blockId).toBe('block-1');

    expect(attachCommand.dto).toEqual({
      database_id: 'database-1',
      view_id: 'view-table-1',
    });

    expect(result.blockIds).toEqual({
      'tasks-table-block': 'block-1',
    });

    expect(result.databaseIds).toEqual({
      'tasks-db': 'database-1',
    });

    expect(result.viewIds).toEqual({
      'tasks-db': {
        'all-tasks': 'view-table-1',
      },
    });

    expect(result.rowIds).toEqual({
      'tasks-db': {},
    });
  });
});
