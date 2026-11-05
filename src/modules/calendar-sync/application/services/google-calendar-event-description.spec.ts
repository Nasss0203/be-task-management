import { PropertyType } from 'src/modules/database/domain/enums/property-type.enum';

import { buildEventDescription } from './google-calendar-event-description';

const option = (id: string, name: string) => ({
  getId: () => id,
  getName: () => name,
});

const property = (
  id: string,
  name: string,
  type: PropertyType,
  position: string,
  options: ReturnType<typeof option>[] = [],
) => ({
  getId: () => id,
  getName: () => name,
  getType: () => type,
  getPosition: () => position,
  getOptions: () => options,
});

const rowWith = (values: Record<string, unknown>) => ({
  getId: () => 'row-1',
  getValues: () =>
    Object.entries(values).map(([propertyId, value]) => ({
      getPropertyId: () => propertyId,
      getValue: () => value,
    })),
});

const properties = [
  property('title', 'Name', PropertyType.TITLE, '0'),
  property('due', 'Due', PropertyType.DATE, '1'),
  property('status', 'Status', PropertyType.STATUS, '2', [
    option('todo', 'To do'),
    option('done', 'Done'),
  ]),
  property('owner', 'Assignee', PropertyType.PERSON, '3'),
  property('tags', 'Tags', PropertyType.MULTI_SELECT, '4', [
    option('fe', 'Frontend'),
    option('be', 'Backend'),
  ]),
  property('points', 'Points', PropertyType.NUMBER, '5'),
  property('review', 'Review', PropertyType.DATE, '6'),
  property('done', 'Approved', PropertyType.CHECKBOX, '7'),
  property('notes', 'Notes', PropertyType.TEXT, '8'),
  property('files', 'Files', PropertyType.FILE, '9'),
  property('created', 'Created', PropertyType.CREATED_TIME, '10'),
];

const describe_ = (values: Record<string, unknown>) =>
  buildEventDescription({
    properties: properties as never,
    row: rowWith(values) as never,
    datePropertyId: 'due',
    peopleNames: new Map([
      ['user-1', 'Nguyen Nam'],
      ['user-2', 'Tran An'],
    ]),
    rowUrl: 'https://app.test/page/p-1/row/row-1',
  });

describe('buildEventDescription', () => {
  it('lists the main properties by position, then links back to the row', () => {
    expect(
      describe_({
        title: 'Launch',
        due: { start: '2026-11-10', end: null },
        status: 'done',
        owner: ['user-1', 'user-2', 'user-gone'],
        tags: ['be', 'fe'],
        points: 3,
        review: { start: '2026-11-12', end: '2026-11-14' },
        done: false,
        notes: '  Ship it  ',
        files: ['file-1'],
        created: '2026-11-01',
      }),
    ).toBe(
      [
        'Status: Done',
        'Assignee: Nguyen Nam, Tran An',
        'Tags: Backend, Frontend',
        'Points: 3',
        'Review: 2026-11-12 → 2026-11-14',
        'Approved: No',
        'Notes: Ship it',
        '',
        'Open in Taskmanly: https://app.test/page/p-1/row/row-1',
      ].join('\n'),
    );
  });

  it('only links back when the row has no other values', () => {
    expect(describe_({ title: 'Launch', notes: '   ', owner: [] })).toBe(
      'Open in Taskmanly: https://app.test/page/p-1/row/row-1',
    );
  });

  it('cuts very long text', () => {
    const line = describe_({ notes: 'x'.repeat(500) }).split('\n')[0];

    expect(line).toHaveLength('Notes: '.length + 300);
    expect(line.endsWith('…')).toBe(true);
  });
});
