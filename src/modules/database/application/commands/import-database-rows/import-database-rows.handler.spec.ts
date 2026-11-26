import { BadRequestException, NotFoundException } from '@nestjs/common';

import { DatabaseProperty } from '../../../domain/aggregates/database/database-property.entity';
import { Database } from '../../../domain/aggregates/database/database.aggregate';
import { PropertyOption } from '../../../domain/aggregates/database/property-option.entity';
import type { DatabaseRow } from '../../../domain/aggregates/row/database-row.aggregate';
import { PropertyType } from '../../../domain/enums/property-type.enum';
import type { AddPropertyCommand } from '../add-property/add-property.command';
import type { ImportColumnMapping } from './import-database-rows.command';
import { ImportDatabaseRowsCommand } from './import-database-rows.command';
import { ImportDatabaseRowsHandler } from './import-database-rows.handler';

const buildDatabase = () =>
  Database.restore({
    id: 'db',
    pageId: 'page',
    name: 'Tasks',
    properties: [
      new DatabaseProperty(
        'title',
        'db',
        'Name',
        PropertyType.TITLE,
        true,
        false,
        '0',
      ),
      new DatabaseProperty(
        'status',
        'db',
        'Status',
        PropertyType.STATUS,
        false,
        true,
        '1',
        [
          new PropertyOption('todo', 'Todo', null, '0'),
          new PropertyOption('done', 'Done', null, '1'),
        ],
      ),
      new DatabaseProperty(
        'due',
        'db',
        'Due',
        PropertyType.DATE,
        false,
        true,
        '2',
      ),
      new DatabaseProperty(
        'owner',
        'db',
        'Owner',
        PropertyType.PERSON,
        false,
        true,
        '3',
      ),
      new DatabaseProperty(
        'created',
        'db',
        'Created',
        PropertyType.CREATED_TIME,
        false,
        true,
        '4',
      ),
    ],
  });

const csv = (text: string) => Buffer.from(text, 'utf8');

describe('ImportDatabaseRowsHandler', () => {
  const context = { transaction: 'tx' };
  let database: Database | null;
  const savedRows: DatabaseRow[] = [];
  const databaseRepository = {
    findById: jest.fn(() => Promise.resolve(database)),
    save: jest.fn(() => Promise.resolve()),
  };
  const rowRepository = {
    findMaxPosition: jest.fn(() => Promise.resolve(7)),
    save: jest.fn((row: DatabaseRow) => {
      savedRows.push(row);
      return Promise.resolve();
    }),
  };
  const peopleReader = {
    findWorkspaceMembers: jest.fn(() =>
      Promise.resolve([
        {
          user_id: 'u1',
          username: 'lan',
          email: 'lan@test.dev',
          full_name: 'Trần Lan',
        },
      ]),
    ),
  };
  const recorder = { record: jest.fn(() => Promise.resolve()) };
  const publisher = { publish: jest.fn() };
  const uow = {
    runInTransaction: jest.fn((fn: (ctx: unknown) => Promise<unknown>) =>
      fn(context),
    ),
  };
  const addPropertyHandler = {
    execute: jest.fn((command: AddPropertyCommand) => {
      const property = new DatabaseProperty(
        `new-${command.name}`,
        'db',
        command.name,
        command.type,
        false,
        true,
        String(database!.getProperties().length),
      );
      database!.addProperty(property);
      return Promise.resolve({ id: property.getId() });
    }),
  };
  const handler = new ImportDatabaseRowsHandler(
    databaseRepository as never,
    rowRepository as never,
    peopleReader as never,
    recorder as never,
    publisher as never,
    uow as never,
    addPropertyHandler as never,
  );

  const run = (
    text: string,
    options: { mapping?: ImportColumnMapping[] | null; dryRun?: boolean } = {},
  ) =>
    handler.execute(
      new ImportDatabaseRowsCommand(
        'db',
        'user-1',
        csv(text),
        options.mapping ?? null,
        'Asia/Ho_Chi_Minh',
        options.dryRun ?? true,
      ),
    );

  beforeEach(() => {
    jest.clearAllMocks();
    savedRows.length = 0;
    database = buildDatabase();
  });

  it('suggests a mapping by column name and previews without writing', async () => {
    const result = await run(
      '﻿Task;status;Due;Owner;Note\nViệc 1;done;22/11/2026;lan@test.dev;x\nViệc 2;Blocked;31/02/2026;Hoa;y\n',
    );

    expect(result.headers).toEqual(['Task', 'status', 'Due', 'Owner', 'Note']);
    expect(result.mapping).toEqual([
      'title',
      'status',
      'due',
      'owner',
      { type: PropertyType.TEXT },
    ]);
    expect(result.suggestedTypes).toEqual([
      null,
      null,
      null,
      null,
      PropertyType.TEXT,
    ]);
    expect(result).toMatchObject({
      totalRows: 2,
      validRows: 1,
      skippedRows: 1,
      createdRows: 0,
      newOptions: [],
      newProperties: [{ column: 4, name: 'Note', type: PropertyType.TEXT }],
    });
    expect(result.preview[0]).toEqual([
      'Việc 1',
      'Done',
      '2026-11-22',
      'Trần Lan',
      'x',
    ]);
    expect(addPropertyHandler.execute).not.toHaveBeenCalled();
    expect(result.errors.map(({ row, column }) => ({ row, column }))).toEqual([
      { row: 2, column: 'Due' },
      { row: 2, column: 'Owner' },
    ]);
    expect(result.errors.every(({ message }) => message.length > 0)).toBe(true);
    expect(uow.runInTransaction).not.toHaveBeenCalled();
    expect(rowRepository.save).not.toHaveBeenCalled();
    expect(databaseRepository.save).not.toHaveBeenCalled();
  });

  it('creates valid rows after the last one, adds used options and skips invalid rows', async () => {
    const result = await run(
      'Name,Status,Due\nA,Blocked,2026-11-22\nB,,2026-02-31\nC,,\n',
      { mapping: ['title', 'status', 'due'], dryRun: false },
    );

    expect(result).toMatchObject({ createdRows: 2, skippedRows: 1 });
    expect(result.newOptions).toEqual([
      { propertyId: 'status', name: 'Blocked', color: '#92400E' },
    ]);
    expect(databaseRepository.save).toHaveBeenCalledWith(database, context);

    const status = database!
      .getProperties()
      .find((item) => item.getId() === 'status')!;
    const blocked = status
      .getOptions()
      .find((option) => option.getName() === 'Blocked')!;
    expect(blocked.getColor()).toBe('#92400E');
    expect(savedRows.map((row) => row.getPosition())).toEqual([8, 9]);
    const valueOf = (row: DatabaseRow, propertyId: string) =>
      row
        .getValues()
        .find((value) => value.getPropertyId() === propertyId)
        ?.getValue();
    expect(valueOf(savedRows[0], 'status')).toBe(blocked.getId());
    expect(valueOf(savedRows[1], 'title')).toBe('C');
    expect(valueOf(savedRows[1], 'status')).toBe('todo');

    expect(recorder.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'DATABASE_ROW_CREATED' }),
      context,
    );
    expect(recorder.record).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'OPTION_ADDED', propertyId: 'status' }),
      context,
    );
    expect(publisher.publish).toHaveBeenCalledWith('db');
  });

  it('does not create options used only by invalid rows', async () => {
    const result = await run('Name,Status,Due\nA,Blocked,bad date\n', {
      mapping: ['title', 'status', 'due'],
      dryRun: false,
    });

    expect(result).toMatchObject({ createdRows: 0, newOptions: [] });
    expect(databaseRepository.save).not.toHaveBeenCalled();
    expect(publisher.publish).not.toHaveBeenCalled();
  });

  it('colors new options the same way in the preview and the import', async () => {
    const text = 'Name,Status\nA,Review\nB,in progress\nC,bad\n';
    const options = { mapping: ['title', 'status'] as ImportColumnMapping[] };

    const preview = await run(text, options);
    const imported = await run(text, { ...options, dryRun: false });

    const expected = [
      { propertyId: 'status', name: 'Review', color: '#92400E' },
      { propertyId: 'status', name: 'in progress', color: '#3B82F6' },
      { propertyId: 'status', name: 'bad', color: '#F97316' },
    ];
    expect(preview.newOptions).toEqual(expected);
    expect(imported.newOptions).toEqual(expected);
    const colors = database!
      .getProperties()
      .find((item) => item.getId() === 'status')!
      .getOptions()
      .map((option) => [option.getName(), option.getColor()]);
    expect(colors).toEqual([
      ['Todo', null],
      ['Done', null],
      ['Review', '#92400E'],
      ['in progress', '#3B82F6'],
      ['bad', '#F97316'],
    ]);
  });

  it('skips rows whose mapped columns are all empty without reporting an error', async () => {
    const result = await run('Name,Due,Note\nA,,\n,,only a note\n', {
      mapping: ['title', 'due', null],
      dryRun: false,
    });

    expect(result).toMatchObject({
      totalRows: 2,
      validRows: 1,
      skippedRows: 1,
      createdRows: 1,
      errors: [],
    });
    expect(savedRows).toHaveLength(1);
  });

  it('previews new properties in memory with unique names and reports their cell errors', async () => {
    const result = await run('Name,Points,,Points\nA,abc,x,1\nB,2,y,2\n', {
      mapping: [
        { type: PropertyType.TEXT },
        { type: PropertyType.NUMBER },
        { type: PropertyType.TEXT },
        { type: PropertyType.NUMBER },
      ],
    });

    expect(
      result.newProperties.map(({ column, name, type }) => ({
        column,
        name,
        type,
      })),
    ).toEqual([
      { column: 0, name: 'Name 2', type: PropertyType.TEXT },
      { column: 1, name: 'Points', type: PropertyType.NUMBER },
      { column: 2, name: 'Column 3', type: PropertyType.TEXT },
      { column: 3, name: 'Points 2', type: PropertyType.NUMBER },
    ]);
    expect(result.errors).toEqual([
      { row: 1, column: 'Points', message: 'Not a number' },
    ]);
    expect(result).toMatchObject({ validRows: 1, createdRows: 0 });
    expect(addPropertyHandler.execute).not.toHaveBeenCalled();
    expect(database!.getProperties()).toHaveLength(5);
  });

  it('creates new properties in the import transaction before saving rows', async () => {
    const result = await run('Name,Points,Stage\nA,3,Doing\nB,5,Done\n', {
      mapping: [
        'title',
        { type: PropertyType.NUMBER },
        { type: PropertyType.STATUS },
      ],
      dryRun: false,
    });

    expect(addPropertyHandler.execute).toHaveBeenCalledTimes(2);
    expect(addPropertyHandler.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        databaseId: 'db',
        name: 'Points',
        type: PropertyType.NUMBER,
        actorId: 'user-1',
      }),
      context,
    );
    expect(result).toMatchObject({ createdRows: 2 });
    expect(result.newProperties.map((property) => property.propertyId)).toEqual(
      ['new-Points', 'new-Stage'],
    );
    expect(result.newOptions.map((option) => option.name)).toEqual([
      'Doing',
      'Done',
    ]);
    const points = savedRows.map((row) =>
      row
        .getValues()
        .find((value) => value.getPropertyId() === 'new-Points')
        ?.getValue(),
    );
    expect(points).toEqual([3, 5]);
  });

  it('rejects creating read-only types or more than 20 properties', async () => {
    await expect(
      run('A\n1\n', {
        mapping: [{ type: PropertyType.TITLE }],
        dryRun: false,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    const headers = Array.from({ length: 21 }, (_, index) => `C${index}`);
    await expect(
      run(`${headers.join(',')}\n${headers.map(() => '1').join(',')}\n`, {
        mapping: headers.map(() => ({ type: PropertyType.NUMBER })),
        dryRun: false,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(addPropertyHandler.execute).not.toHaveBeenCalled();
  });

  it('suggests at most 20 new properties and leaves the other columns out', async () => {
    const headers = Array.from({ length: 22 }, (_, index) => `C${index}`);
    const result = await run(
      `Name,${headers.join(',')}\nA,${headers.map(() => '1').join(',')}\n`,
    );

    expect(result.mapping.filter((entry) => entry !== null)).toHaveLength(21);
    expect(result.mapping.slice(-2)).toEqual([null, null]);
    expect(result.suggestedTypes.at(-1)).toBe(PropertyType.NUMBER);
  });

  it('rejects mappings that are the wrong length, repeat a property or target read-only columns', async () => {
    await expect(
      run('A,B\n1,2\n', { mapping: ['title'] }),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      run('A,B\n1,2\n', { mapping: ['title', 'title'] }),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      run('A,B\n1,2\n', { mapping: ['title', 'created'] }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects files over the row limit before touching the database', async () => {
    const rows = Array.from(
      { length: 1001 },
      (_, index) => `row ${index}`,
    ).join('\n');

    await expect(run(`Name\n${rows}\n`)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(databaseRepository.findById).not.toHaveBeenCalled();
  });

  it('returns 404 when the database is missing', async () => {
    database = null;

    await expect(run('Name\nA\n')).rejects.toBeInstanceOf(NotFoundException);
  });
});
