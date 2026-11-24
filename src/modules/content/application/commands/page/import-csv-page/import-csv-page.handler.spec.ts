import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { CreatePageBlocksFromSnapshotInput } from 'src/modules/content/application/ports/content-page-provisioning.port';
import type { ImportDatabaseRowsCommand } from 'src/modules/database/application/commands/import-database-rows/import-database-rows.command';
import { Database } from 'src/modules/database/domain/aggregates/database/database.aggregate';
import { PropertyType } from 'src/modules/database/domain/enums/property-type.enum';
import { CreatePageCommand } from '../create-page/create-page.command';
import {
  ImportCsvPageCommand,
  type ImportCsvTarget,
} from './import-csv-page.command';
import {
  ImportCsvPageHandler,
  NEW_DATABASE_TITLE_PROPERTY_ID,
} from './import-csv-page.handler';

describe('ImportCsvPageHandler', () => {
  const context = { transaction: true };
  const csv = Buffer.from('Task,Status\nWrite spec,Done\n');
  const page = {
    getId: () => 'page-1',
    getWorkspaceId: () => 'workspace-1',
    getDeletedAt: () => null,
  };
  const created = Database.create({
    id: 'db-new',
    pageId: 'page-new',
    name: 'tasks',
    titlePropertyId: 'title-real',
    assigneePropertyId: 'assignee',
    dueDatePropertyId: 'due',
    titleOnly: true,
  });
  const importResult = {
    headers: ['Task', 'Status'],
    mapping: [],
    suggestedTypes: [],
    newProperties: [],
    totalRows: 1,
    validRows: 1,
    skippedRows: 0,
    createdRows: 1,
    preview: [],
    newOptions: [],
    errors: [],
  };

  const pageRepo = { findById: jest.fn(), touch: jest.fn() };
  const pageBlockRepo = { findLastSibling: jest.fn() };
  const createPage = {
    execute: jest
      .fn<Promise<{ id: string }>, [CreatePageCommand, unknown]>()
      .mockResolvedValue({ id: 'page-new' }),
  };
  const pageProvisioning = {
    createBlocksFromSnapshot: jest
      .fn<Promise<void>, [CreatePageBlocksFromSnapshotInput, unknown]>()
      .mockResolvedValue(undefined),
  };
  const databaseRepo = { findById: jest.fn() };
  const createDatabase = {
    execute: jest.fn<Promise<unknown>, [unknown, unknown?]>(),
  };
  const renameProperty = {
    execute: jest.fn<Promise<unknown>, [unknown, unknown?]>(),
  };
  const createView = {
    execute: jest.fn<Promise<unknown>, [unknown, unknown?]>(),
  };
  const importRows = {
    importIntoDatabase: jest
      .fn<
        Promise<typeof importResult>,
        [ImportDatabaseRowsCommand, Database, unknown?]
      >()
      .mockResolvedValue(importResult),
  };
  const calls: string[] = [];
  const uow = {
    runInTransaction: jest.fn((work: (ctx: unknown) => Promise<unknown>) =>
      work(context),
    ),
  };
  const handler = new ImportCsvPageHandler(
    pageRepo as never,
    pageBlockRepo as never,
    createPage as never,
    pageProvisioning as never,
    databaseRepo as never,
    createDatabase as never,
    renameProperty as never,
    createView as never,
    importRows as never,
    uow as never,
  );

  const run = (
    target: ImportCsvTarget,
    options: { dryRun?: boolean; mapping?: (string | null)[] | null } = {},
  ) =>
    handler.execute(
      new ImportCsvPageCommand(
        'page-1',
        'user-1',
        target,
        'tasks.csv',
        csv,
        options.mapping ?? null,
        'Asia/Ho_Chi_Minh',
        options.dryRun ?? false,
      ),
    );

  beforeEach(() => {
    jest.clearAllMocks();
    calls.length = 0;
    pageRepo.findById.mockResolvedValue(page);
    pageBlockRepo.findLastSibling.mockResolvedValue(null);
    databaseRepo.findById.mockResolvedValue(created);
    createDatabase.execute.mockResolvedValue(created);
    importRows.importIntoDatabase.mockImplementation(() => {
      calls.push('import');
      return Promise.resolve(importResult);
    });
    createView.execute.mockImplementation(() => {
      calls.push('view');
      return Promise.resolve({ id: 'view-1' });
    });
  });

  it('previews against an unsaved database without writing anything', async () => {
    const result = await run('child_page', { dryRun: true });

    expect(uow.runInTransaction).not.toHaveBeenCalled();
    expect(createPage.execute).not.toHaveBeenCalled();
    expect(createDatabase.execute).not.toHaveBeenCalled();
    const [command, draft, draftContext] =
      importRows.importIntoDatabase.mock.calls[0];
    expect(draftContext).toBeUndefined();
    expect(command.dryRun).toBe(true);
    expect(command.membersPageId).toBe('page-1');
    expect(
      draft
        .getProperties()
        .map((property) => [
          property.getId(),
          property.getName(),
          property.getType(),
        ]),
    ).toEqual([[NEW_DATABASE_TITLE_PROPERTY_ID, 'Task', PropertyType.TITLE]]);
    expect(result).toMatchObject({ pageId: null, databaseId: null });
  });

  it('creates a child page holding the database in one transaction', async () => {
    const result = await run('child_page', {
      mapping: [NEW_DATABASE_TITLE_PROPERTY_ID, null],
    });

    expect(createPage.execute.mock.calls[0]).toEqual([
      new CreatePageCommand('user-1', 'workspace-1', 'tasks', null, 'page-1'),
      context,
    ]);
    expect(createDatabase.execute.mock.calls[0][0]).toMatchObject({
      pageId: 'page-new',
      name: 'tasks',
      titleOnly: true,
    });
    expect(renameProperty.execute.mock.calls[0][0]).toMatchObject({
      databaseId: 'db-new',
      propertyId: 'title-real',
      name: 'Task',
    });
    const [command, , importContext] =
      importRows.importIntoDatabase.mock.calls[0];
    expect(command.mapping).toEqual(['title-real', null]);
    expect(command.dryRun).toBe(false);
    expect(importContext).toBe(context);
    expect(calls).toEqual(['import', 'view']);

    const [input] = pageProvisioning.createBlocksFromSnapshot.mock.calls[0];
    expect(input.pageId).toBe('page-new');
    expect(input.blocks[0]).toMatchObject({
      orderIndex: 0,
      dataConfig: { database_id: 'db-new', view_id: 'view-1' },
    });
    expect(result).toMatchObject({ pageId: 'page-new', databaseId: 'db-new' });
  });

  it('appends the database to the end of the current page', async () => {
    pageBlockRepo.findLastSibling.mockResolvedValue({
      getOrderIndex: () => 4,
    });

    const result = await run('current_page');

    expect(createPage.execute).not.toHaveBeenCalled();
    expect(createDatabase.execute.mock.calls[0][0]).toMatchObject({
      pageId: 'page-1',
    });
    expect(pageBlockRepo.findLastSibling).toHaveBeenCalledWith(
      'page-1',
      null,
      null,
      context,
    );
    const [input] = pageProvisioning.createBlocksFromSnapshot.mock.calls[0];
    expect(input.blocks[0].orderIndex).toBe(5);
    expect(pageRepo.touch).toHaveBeenCalledWith('page-1', context);
    expect(result).toMatchObject({ pageId: 'page-1', databaseId: 'db-new' });
  });

  it('rejects a mapping that points at an existing property', async () => {
    await expect(
      run('child_page', { mapping: ['some-property-id', null] }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(uow.runInTransaction).not.toHaveBeenCalled();
  });

  it('rejects a missing page', async () => {
    pageRepo.findById.mockResolvedValue(null);

    await expect(run('child_page')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('keeps the default title name when the first header is empty', async () => {
    const emptyHeader = Buffer.from(',Status\nA,Done\n');
    await handler.execute(
      new ImportCsvPageCommand(
        'page-1',
        'user-1',
        'current_page',
        'tasks.csv',
        emptyHeader,
        null,
        null,
        false,
      ),
    );

    expect(renameProperty.execute).not.toHaveBeenCalled();
  });
});
