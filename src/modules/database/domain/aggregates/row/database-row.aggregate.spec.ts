import { Database } from '../database/database.aggregate';
import { DatabaseRow } from './database-row.aggregate';
import { RowValue } from './row-value.entity';
import type { RowValueData } from './row-value.type';

describe('DatabaseRow date values', () => {
  const database = Database.create({
    id: 'db',
    pageId: 'page',
    name: 'Tasks',
    titlePropertyId: 'title',
    assigneePropertyId: 'assignee',
    dueDatePropertyId: 'due',
  });
  const due = database.getProperties().find((item) => item.getId() === 'due')!;
  const setDue = (value: RowValueData) => {
    const row = DatabaseRow.create({ id: 'row', databaseId: 'db' });
    return row.setValue(due, new RowValue('value', 'row', 'due', value));
  };

  it('keeps accepting date-only values as before', () => {
    expect(() => setDue({ start: '2026-11-20' })).not.toThrow();
    expect(() =>
      setDue({ start: '2026-11-20', end: '2026-11-22' }),
    ).not.toThrow();
  });

  it('accepts a time with a valid time zone and an end after the start', () => {
    expect(() =>
      setDue({
        start: '2026-11-20T09:00',
        end: '2026-11-20T10:30',
        timeZone: 'Asia/Ho_Chi_Minh',
      }),
    ).not.toThrow();
    expect(() =>
      setDue({ start: '2026-11-20T09:00', timeZone: 'Asia/Ho_Chi_Minh' }),
    ).not.toThrow();
  });

  it('rejects a time without a valid time zone', () => {
    expect(() => setDue({ start: '2026-11-20T09:00' })).toThrow('time zone');
    expect(() =>
      setDue({ start: '2026-11-20T09:00', timeZone: 'Mars/Base' }),
    ).toThrow('time zone');
  });

  it('rejects an end time that is not after the start or not a time', () => {
    const zone = { timeZone: 'Asia/Ho_Chi_Minh' };
    expect(() =>
      setDue({ start: '2026-11-20T09:00', end: '2026-11-20T09:00', ...zone }),
    ).toThrow('end time');
    expect(() =>
      setDue({ start: '2026-11-20T09:00', end: '2026-11-21', ...zone }),
    ).toThrow('end time');
  });
});
