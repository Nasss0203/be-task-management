import { DatabaseProperty } from '../database/database-property.entity';
import { Database } from '../database/database.aggregate';
import { PropertyType } from '../../enums/property-type.enum';
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

  it('rejects dates that are neither a plain date nor a local time', () => {
    const zone = { timeZone: 'Asia/Ho_Chi_Minh' };
    expect(() =>
      setDue({ start: '2026-11-01T09:30:00.000Z', ...zone }),
    ).toThrow('YYYY-MM-DDTHH:mm');
    expect(() => setDue({ start: '26/11/2026' })).toThrow('YYYY-MM-DD');
    expect(() => setDue({ start: '' })).toThrow('YYYY-MM-DD');
  });

  it('rejects a plain date whose end is not a plain date', () => {
    expect(() =>
      setDue({ start: '2026-11-20', end: '2026-11-22T10:00' }),
    ).toThrow('end date');
    expect(() =>
      setDue({ start: '2026-11-20', end: '2026-11-22T00:00:00.000Z' }),
    ).toThrow('end date');
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

describe('DatabaseRow contact values', () => {
  const setContact = (type: PropertyType, value: RowValueData) => {
    const property = new DatabaseProperty(
      'contact',
      'db',
      type,
      type,
      false,
      true,
      '1',
    );
    const row = DatabaseRow.create({ id: 'row', databaseId: 'db' });
    return row.setValue(
      property,
      new RowValue('value', 'row', 'contact', value),
    );
  };

  it('accepts valid values, empty text and null', () => {
    expect(() =>
      setContact(PropertyType.URL, 'example.com/docs'),
    ).not.toThrow();
    expect(() => setContact(PropertyType.EMAIL, 'a@b.co')).not.toThrow();
    expect(() =>
      setContact(PropertyType.PHONE, '+84 912 345 678'),
    ).not.toThrow();
    expect(() => setContact(PropertyType.EMAIL, '  ')).not.toThrow();
    expect(() => setContact(PropertyType.PHONE, null)).not.toThrow();
  });

  it('rejects values in the wrong format', () => {
    expect(() => setContact(PropertyType.URL, 'http://localhost')).toThrow(
      'URL property requires a valid http or https link',
    );
    expect(() => setContact(PropertyType.EMAIL, 'abc')).toThrow(
      'EMAIL property requires a valid email address',
    );
    expect(() => setContact(PropertyType.PHONE, '123')).toThrow(
      'PHONE property requires a valid phone number',
    );
  });
});
