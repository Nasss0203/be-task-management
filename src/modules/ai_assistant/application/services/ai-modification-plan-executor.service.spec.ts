import { CreatePageBlockCommand } from 'src/modules/content/application/commands/page-block/create-page-block/create-page-block.command';
import { CreatePageBlockHandler } from 'src/modules/content/application/commands/page-block/create-page-block/create-page-block.handler';
import { ConflictException } from '@nestjs/common';

import { DeletePageBlockCommand } from 'src/modules/content/application/commands/page-block/delete-page-block/delete-page-block.command';

import { DeletePageBlockHandler } from 'src/modules/content/application/commands/page-block/delete-page-block/delete-page-block.handler';

import { UpdatePageBlockCommand } from 'src/modules/content/application/commands/page-block/update-page-block/update-page-block.command';

import { UpdatePageBlockHandler } from 'src/modules/content/application/commands/page-block/update-page-block/update-page-block.handler';

import type { PageBlockRepository } from 'src/modules/content/domain/repositories/page-block.repository';

import type { PageRepository } from 'src/modules/content/domain/repositories/page.repository';
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

  let pageRepository: {
    touch: jest.Mock;
  };
  let updatePageBlockHandler: {
    execute: jest.Mock;
  };
  let pageBlockRepository: {
    findById: jest.Mock;
  };
  let deletePageBlockHandler: {
    execute: jest.Mock;
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

    pageRepository = {
      touch: jest.fn().mockResolvedValue(undefined),
    };
    updatePageBlockHandler = {
      execute: jest.fn().mockResolvedValue({}),
    };
    pageBlockRepository = {
      findById: jest.fn(),
    };
    deletePageBlockHandler = {
      execute: jest.fn().mockResolvedValue(undefined),
    };
    executor = new AiModificationPlanExecutor(
      createPageBlockHandler as unknown as CreatePageBlockHandler,
      createDatabaseRowHandler as unknown as CreateDatabaseRowHandler,
      setRowValueHandler as unknown as SetRowValueHandler,
      unitOfWork as unknown as UnitOfWork,
      pageRepository as unknown as PageRepository,
      updatePageBlockHandler as unknown as UpdatePageBlockHandler,
      pageBlockRepository as unknown as PageBlockRepository,
      deletePageBlockHandler as unknown as DeletePageBlockHandler,
    );
  });

  describe('DELETE_BLOCK (kế hoạch xoá block)', () => {
    const deletePlan: AiModificationPlanReady = {
      schemaVersion: 1,
      type: 'AI_MODIFICATION_PLAN',
      pageId: 'page-1',
      status: 'PLAN_READY',
      summary: 'Xoá',
      operations: [
        {
          type: 'DELETE_BLOCK',
          blockId: 'todo-1',
          text: 'Gửi email',
          childCount: 0,
        },
      ],
    };
    const block = (overrides: { pageId?: string; text?: string } = {}) => ({
      getPageId: () => overrides.pageId ?? 'page-1',
      getType: () => PageBlockType.TODO,
      getContent: () => ({
        text: overrides.text ?? 'Gửi email',
        checked: false,
      }),
    });

    it('soft-deletes the block and everything nested in it as the user', async () => {
      pageBlockRepository.findById.mockResolvedValue(block());
      const result = await executor.execute({
        userId: 'user-1',
        plan: deletePlan,
      });
      const [command] = deletePageBlockHandler.execute.mock.calls[0] as [
        DeletePageBlockCommand,
      ];
      expect(command).toMatchObject({ blockId: 'todo-1', userId: 'user-1' });
      expect(result.deletedBlockIds).toEqual(['todo-1']);
    });

    it.each([
      ['a missing block', null],
      ['a block of another page', block({ pageId: 'page-2' })],
      ['a block whose text changed', block({ text: 'Gửi thư' })],
    ])('refuses %s without deleting', async (_name, current) => {
      pageBlockRepository.findById.mockResolvedValue(current);
      await expect(
        executor.execute({ userId: 'user-1', plan: deletePlan }),
      ).rejects.toThrow(ConflictException);
      expect(deletePageBlockHandler.execute).not.toHaveBeenCalled();
    });
  });

  describe('SET_BLOCK_TEXT (kế hoạch sửa chữ block)', () => {
    const editPlan: AiModificationPlanReady = {
      schemaVersion: 1,
      type: 'AI_MODIFICATION_PLAN',
      pageId: 'page-1',
      status: 'PLAN_READY',
      summary: 'Sửa',
      operations: [
        {
          type: 'SET_BLOCK_TEXT',
          blockId: 'todo-1',
          oldText: 'Gửi email',
          newText: 'Gửi thư',
        },
      ],
    };
    const block = (
      overrides: { pageId?: string; text?: string; type?: PageBlockType } = {},
    ) => ({
      getPageId: () => overrides.pageId ?? 'page-1',
      getType: () => overrides.type ?? PageBlockType.TODO,
      getContent: () => ({
        text: overrides.text ?? 'Gửi email',
        checked: true,
      }),
    });

    it('changes only the text, keeping the rest of the content', async () => {
      pageBlockRepository.findById.mockResolvedValue(block());
      const result = await executor.execute({
        userId: 'user-1',
        plan: editPlan,
      });
      const [command] = updatePageBlockHandler.execute.mock.calls[0] as [
        UpdatePageBlockCommand,
      ];
      expect(command.blockId).toBe('todo-1');
      expect(command.updates).toEqual({
        content: { text: 'Gửi thư', checked: true },
      });
      expect(result.updatedBlockIds).toEqual(['todo-1']);
    });

    it.each([
      ['a missing block', null],
      ['a block of another page', block({ pageId: 'page-2' })],
      ['a block whose text changed', block({ text: 'Gửi email cho sếp' })],
      [
        'a block without editable text',
        block({ type: PageBlockType.DATABASE_VIEW }),
      ],
    ])('refuses %s without writing', async (_name, current) => {
      pageBlockRepository.findById.mockResolvedValue(current);
      await expect(
        executor.execute({ userId: 'user-1', plan: editPlan }),
      ).rejects.toThrow(ConflictException);
      expect(updatePageBlockHandler.execute).not.toHaveBeenCalled();
    });
  });

  describe('SET_TODO_CHECKED (kế hoạch tích to-do)', () => {
    const todo = (
      overrides: { pageId?: string; type?: PageBlockType } = {},
    ) => ({
      getPageId: () => overrides.pageId ?? 'page-1',
      getType: () => overrides.type ?? PageBlockType.TODO,
      getContent: () => ({
        text: 'Gửi email',
        checked: false,
        marks: ['bold'],
      }),
    });
    const plan = (
      ...operations: AiModificationPlanReady['operations']
    ): AiModificationPlanReady => ({
      schemaVersion: 1,
      type: 'AI_MODIFICATION_PLAN',
      pageId: 'page-1',
      status: 'PLAN_READY',
      summary: 'Tích',
      operations,
    });
    const tick = (checked = true) => ({
      type: 'SET_TODO_CHECKED' as const,
      blockId: 'todo-1',
      text: 'Gửi email',
      checked,
    });

    it.each([true, false])(
      'changes only checked (%s), keeping the rest of the content',
      async (checked) => {
        pageBlockRepository.findById.mockResolvedValue(todo());
        const result = await executor.execute({
          userId: 'user-1',
          plan: plan(tick(checked)),
        });
        expect(pageBlockRepository.findById).toHaveBeenCalledWith(
          'todo-1',
          context,
        );
        const [command] = updatePageBlockHandler.execute.mock.calls[0] as [
          UpdatePageBlockCommand,
        ];
        expect(command.blockId).toBe('todo-1');
        expect(command.updates).toEqual({
          content: { text: 'Gửi email', checked, marks: ['bold'] },
        });
        expect(result).toEqual({
          createdBlockIds: [],
          createdRowIds: [],
          updatedBlockIds: ['todo-1'],
          deletedBlockIds: [],
        });
        expect(pageRepository.touch).toHaveBeenCalledWith('page-1', context);
      },
    );

    it.each([
      ['a missing block', null],
      ['a block of another page', todo({ pageId: 'page-2' })],
      ['a block that is no longer a to-do', todo({ type: PageBlockType.TEXT })],
    ])('refuses %s without writing', async (_name, block) => {
      pageBlockRepository.findById.mockResolvedValue(block);
      await expect(
        executor.execute({ userId: 'user-1', plan: plan(tick()) }),
      ).rejects.toThrow(ConflictException);
      expect(updatePageBlockHandler.execute).not.toHaveBeenCalled();
      expect(pageRepository.touch).not.toHaveBeenCalled();
    });
  });

  describe('Page "Edited" time', () => {
    const plan = (
      operations: AiModificationPlanReady['operations'],
    ): AiModificationPlanReady => ({
      schemaVersion: 1,
      type: 'AI_MODIFICATION_PLAN',
      pageId: 'page-1',
      status: 'PLAN_READY',
      summary: 'Edit',
      operations,
    });

    it('marks the Page edited once, inside the apply transaction', async () => {
      createPageBlockHandler.execute
        .mockResolvedValueOnce({ id: 'block-a' })
        .mockResolvedValueOnce({ id: 'block-b' });
      await executor.execute({
        userId: 'user-1',
        plan: plan([
          {
            type: 'INSERT_BLOCKS',
            parentBlockId: null,
            afterBlockId: null,
            blocks: [
              {
                type: PageBlockType.TODO,
                content: { text: 'A', checked: false },
              },
              {
                type: PageBlockType.TODO,
                content: { text: 'B', checked: false },
              },
            ],
          },
        ]),
      });
      expect(pageRepository.touch).toHaveBeenCalledTimes(1);
      expect(pageRepository.touch).toHaveBeenCalledWith('page-1', context);
    });

    it('also marks the Page edited when only database rows are added', async () => {
      createDatabaseRowHandler.execute.mockResolvedValue({
        getId: () => 'row-1',
      });
      await executor.execute({
        userId: 'user-1',
        plan: plan([
          {
            type: 'CREATE_DATABASE_ROWS',
            databaseId: 'database-1',
            rows: [{ values: {} }],
          },
        ]),
      });
      expect(pageRepository.touch).toHaveBeenCalledWith('page-1', context);
    });

    it('does not mark the Page edited when applying fails', async () => {
      createPageBlockHandler.execute.mockRejectedValue(new Error('failed'));
      await expect(
        executor.execute({
          userId: 'user-1',
          plan: plan([
            {
              type: 'INSERT_BLOCKS',
              parentBlockId: null,
              afterBlockId: null,
              blocks: [{ type: PageBlockType.TEXT, content: { text: 'A' } }],
            },
          ]),
        }),
      ).rejects.toThrow('failed');
      expect(pageRepository.touch).not.toHaveBeenCalled();
    });
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
      updatedBlockIds: [],
      deletedBlockIds: [],
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
      updatedBlockIds: [],
      deletedBlockIds: [],
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
