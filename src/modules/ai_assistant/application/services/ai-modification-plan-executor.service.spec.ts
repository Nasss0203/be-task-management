import { CreatePageBlockCommand } from 'src/modules/content/application/commands/page-block/create-page-block/create-page-block.command';
import { CreatePageBlockHandler } from 'src/modules/content/application/commands/page-block/create-page-block/create-page-block.handler';
import { PageBlockType } from 'src/shared/domain/page-block-type.enum';

import { CreateDatabaseRowCommand } from 'src/modules/database/application/commands/create-database-row/create-database-row.command';
import { CreateDatabaseRowHandler } from 'src/modules/database/application/commands/create-database-row/create-database-row.handler';
import { SetRowValueCommand } from 'src/modules/database/application/commands/set-row-value/set-row-value.command';
import { SetRowValueHandler } from 'src/modules/database/application/commands/set-row-value/set-row-value.handler';

import type { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';
import type { UnitOfWork } from 'src/shared/infrastructure/persistence/unit-of-work.interface';

import type {
  AiInsertBlocksOperation,
  AiModificationPlanReady,
} from '../types/ai-modification-plan';

import { AiModificationPlanExecutor } from './ai-modification-plan-executor.service';

describe('AiModificationPlanExecutor', () => {
  const context = {
    transaction: 'test-context',
  } as unknown as PersistenceContext;

  let createPageBlockHandler: {
    execute: jest.Mock;
  };

  let createDatabaseRowHandler: {
    execute: jest.Mock;
  };

  let setRowValueHandler: {
    execute: jest.Mock;
  };

  let unitOfWork: {
    runInTransaction: jest.Mock;
  };

  let executor: AiModificationPlanExecutor;

  beforeEach(() => {
    createPageBlockHandler = {
      execute: jest.fn(),
    };

    createDatabaseRowHandler = {
      execute: jest.fn(),
    };

    setRowValueHandler = {
      execute: jest.fn(),
    };

    unitOfWork = {
      runInTransaction: jest.fn(
        async (
          fn: (context: PersistenceContext) => Promise<unknown>,
        ): Promise<unknown> => fn(context),
      ),
    };

    executor = new AiModificationPlanExecutor(
      createPageBlockHandler as unknown as CreatePageBlockHandler,
      createDatabaseRowHandler as unknown as CreateDatabaseRowHandler,
      setRowValueHandler as unknown as SetRowValueHandler,
      unitOfWork as unknown as UnitOfWork,
    );
  });

  it('inserts blocks sequentially by chaining the created block id', async () => {
    createPageBlockHandler.execute
      .mockResolvedValueOnce({
        id: 'block-a',
      })
      .mockResolvedValueOnce({
        id: 'block-b',
      })
      .mockResolvedValueOnce({
        id: 'block-c',
      });

    const plan: AiModificationPlanReady = {
      schemaVersion: 1,
      type: 'AI_MODIFICATION_PLAN',
      pageId: 'page-1',
      status: 'PLAN_READY',
      summary: 'Insert three blocks',
      operations: [
        {
          type: 'INSERT_BLOCKS',
          parentBlockId: 'parent-block',
          afterBlockId: 'existing-block',
          blocks: [
            {
              type: PageBlockType.TEXT,
              content: {
                text: 'Block A',
              },
            },
            {
              type: PageBlockType.TEXT,
              content: {
                text: 'Block B',
              },
            },
            {
              type: PageBlockType.TEXT,
              content: {
                text: 'Block C',
              },
            },
          ],
        },
      ],
    };

    const result = await executor.execute({
      userId: 'user-1',
      plan,
    });

    expect(unitOfWork.runInTransaction).toHaveBeenCalledTimes(1);

    expect(createPageBlockHandler.execute).toHaveBeenCalledTimes(3);

    const firstCommand = createPageBlockHandler.execute.mock
      .calls[0][0] as CreatePageBlockCommand;

    const secondCommand = createPageBlockHandler.execute.mock
      .calls[1][0] as CreatePageBlockCommand;

    const thirdCommand = createPageBlockHandler.execute.mock
      .calls[2][0] as CreatePageBlockCommand;

    expect(firstCommand.input).toMatchObject({
      pageId: 'page-1',
      parentBlockId: 'parent-block',
      afterBlockId: 'existing-block',
      type: PageBlockType.TEXT,
      createdBy: 'user-1',
      content: {
        text: 'Block A',
      },
    });

    expect(secondCommand.input).toMatchObject({
      pageId: 'page-1',
      parentBlockId: 'parent-block',
      afterBlockId: 'block-a',
      type: PageBlockType.TEXT,
      createdBy: 'user-1',
      content: {
        text: 'Block B',
      },
    });

    expect(thirdCommand.input).toMatchObject({
      pageId: 'page-1',
      parentBlockId: 'parent-block',
      afterBlockId: 'block-b',
      type: PageBlockType.TEXT,
      createdBy: 'user-1',
      content: {
        text: 'Block C',
      },
    });

    expect(result).toEqual({
      createdBlockIds: ['block-a', 'block-b', 'block-c'],
      createdRowIds: [],
    });
  });

  it('keeps plan order when several operations insert after the same block', async () => {
    createPageBlockHandler.execute.mockImplementation(
      (command: CreatePageBlockCommand) =>
        Promise.resolve({
          id: `created-${String((command.input.content as { text: string }).text)}`,
        }),
    );
    const insert = (
      text: string,
      afterBlockId: string | null,
    ): AiInsertBlocksOperation => ({
      type: 'INSERT_BLOCKS',
      parentBlockId: null,
      afterBlockId,
      blocks: [{ type: PageBlockType.TODO, content: { text, checked: false } }],
    });
    const plan: AiModificationPlanReady = {
      schemaVersion: 1,
      type: 'AI_MODIFICATION_PLAN',
      pageId: 'page-1',
      status: 'PLAN_READY',
      summary: 'Checklist',
      operations: [
        insert('1', 'tasks-heading'),
        insert('other', 'other-block'),
        insert('2', 'tasks-heading'),
        insert('end', null),
        insert('3', 'tasks-heading'),
      ],
    };

    await executor.execute({ userId: 'user-1', plan });

    const anchors = createPageBlockHandler.execute.mock.calls.map(
      ([command]: [CreatePageBlockCommand]) => command.input.afterBlockId,
    );
    // "1", "2", "3" follow each other instead of ending up as 3, 2, 1.
    expect(anchors).toEqual([
      'tasks-heading',
      'other-block',
      'created-1',
      null,
      'created-2',
    ]);
  });

  it('creates database rows and sets every row value using the transaction context', async () => {
    const row1 = {
      getId: jest.fn().mockReturnValue('row-1'),
    };

    const row2 = {
      getId: jest.fn().mockReturnValue('row-2'),
    };

    createDatabaseRowHandler.execute
      .mockResolvedValueOnce(row1)
      .mockResolvedValueOnce(row2);

    setRowValueHandler.execute.mockResolvedValue({});

    const plan: AiModificationPlanReady = {
      schemaVersion: 1,
      type: 'AI_MODIFICATION_PLAN',
      pageId: 'page-1',
      status: 'PLAN_READY',
      summary: 'Create two task rows',
      operations: [
        {
          type: 'CREATE_DATABASE_ROWS',
          databaseId: 'database-1',
          rows: [
            {
              values: {
                'property-title': 'Task 1',
                'property-status': 'TODO',
              },
            },
            {
              values: {
                'property-title': 'Task 2',
              },
            },
          ],
        },
      ],
    };

    const result = await executor.execute({
      userId: 'user-1',
      plan,
    });

    expect(unitOfWork.runInTransaction).toHaveBeenCalledTimes(1);

    expect(createDatabaseRowHandler.execute).toHaveBeenCalledTimes(2);

    const firstCreateCommand = createDatabaseRowHandler.execute.mock
      .calls[0][0] as CreateDatabaseRowCommand;

    const secondCreateCommand = createDatabaseRowHandler.execute.mock
      .calls[1][0] as CreateDatabaseRowCommand;

    expect(firstCreateCommand.databaseId).toBe('database-1');
    expect(secondCreateCommand.databaseId).toBe('database-1');

    expect(createDatabaseRowHandler.execute.mock.calls[0][1]).toBe(context);
    expect(createDatabaseRowHandler.execute.mock.calls[1][1]).toBe(context);

    expect(setRowValueHandler.execute).toHaveBeenCalledTimes(3);

    const firstValueCommand = setRowValueHandler.execute.mock
      .calls[0][0] as SetRowValueCommand;

    const secondValueCommand = setRowValueHandler.execute.mock
      .calls[1][0] as SetRowValueCommand;

    const thirdValueCommand = setRowValueHandler.execute.mock
      .calls[2][0] as SetRowValueCommand;

    expect(firstValueCommand).toMatchObject({
      rowId: 'row-1',
      propertyId: 'property-title',
      value: 'Task 1',
    });

    expect(secondValueCommand).toMatchObject({
      rowId: 'row-1',
      propertyId: 'property-status',
      value: 'TODO',
    });

    expect(thirdValueCommand).toMatchObject({
      rowId: 'row-2',
      propertyId: 'property-title',
      value: 'Task 2',
    });

    expect(setRowValueHandler.execute.mock.calls[0][1]).toBe(context);
    expect(setRowValueHandler.execute.mock.calls[1][1]).toBe(context);
    expect(setRowValueHandler.execute.mock.calls[2][1]).toBe(context);

    expect(result).toEqual({
      createdBlockIds: [],
      createdRowIds: ['row-1', 'row-2'],
    });
  });

  it('stops execution and propagates an operation failure', async () => {
    createPageBlockHandler.execute
      .mockResolvedValueOnce({
        id: 'block-a',
      })
      .mockRejectedValueOnce(new Error('Create block failed'));

    const plan: AiModificationPlanReady = {
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
          blocks: [
            {
              type: PageBlockType.TEXT,
              content: {
                text: 'Block A',
              },
            },
            {
              type: PageBlockType.TEXT,
              content: {
                text: 'Block B',
              },
            },
          ],
        },
      ],
    };

    await expect(
      executor.execute({
        userId: 'user-1',
        plan,
      }),
    ).rejects.toThrow('Create block failed');

    expect(unitOfWork.runInTransaction).toHaveBeenCalledTimes(1);
    expect(createPageBlockHandler.execute).toHaveBeenCalledTimes(2);
    expect(createDatabaseRowHandler.execute).not.toHaveBeenCalled();
  });
});
