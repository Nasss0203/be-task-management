import { DatabaseProperty } from '../../../domain/aggregates/database/database-property.entity';
import { PropertyType } from '../../../domain/enums/property-type.enum';
import { convertCsvCell, type CsvCellContext } from './convert-csv-cell';

const property = (type: PropertyType) =>
  new DatabaseProperty(`p-${type}`, 'db', type, type, false, true, '1');

const context: CsvCellContext = {
  timeZone: 'Asia/Ho_Chi_Minh',
  people: [
    { userId: 'u1', displayName: 'Lan', names: ['lan', 'lan@test.dev'] },
    { userId: 'u2', displayName: 'Nam A', names: ['nam'] },
    { userId: 'u3', displayName: 'Nam B', names: ['nam'] },
  ],
  resolveOption: (_property, name) =>
    name.toLowerCase() === 'done'
      ? { id: 'opt-done', name: 'Done', isNew: false }
      : { id: `new-${name}`, name, isNew: true },
};

const convert = (type: PropertyType, text: string, ctx = context) =>
  convertCsvCell(property(type), text, ctx);

describe('convertCsvCell', () => {
  it('skips empty cells', () => {
    expect(convert(PropertyType.TEXT, '   ')).toBeNull();
  });

  it('keeps text and drops the formula guard added by Export CSV', () => {
    expect(convert(PropertyType.TEXT, "'=SUM(A1)")).toMatchObject({
      ok: true,
      value: '=SUM(A1)',
    });
    expect(convert(PropertyType.NUMBER, "'-5")).toMatchObject({
      ok: true,
      value: -5,
    });
    expect(convert(PropertyType.TEXT, "'plain")).toMatchObject({
      value: "'plain",
    });
  });

  it('keeps valid links, emails and phones and rejects wrong formats', () => {
    expect(convert(PropertyType.URL, 'example.com/docs')).toMatchObject({
      ok: true,
      value: 'example.com/docs',
    });
    expect(convert(PropertyType.EMAIL, 'lan@test.dev')).toMatchObject({
      ok: true,
    });
    expect(convert(PropertyType.PHONE, '+84 912 345 678')).toMatchObject({
      ok: true,
    });
    expect(convert(PropertyType.URL, 'javascript:alert(1)')).toEqual({
      ok: false,
      message: 'Not a valid URL',
    });
    expect(convert(PropertyType.EMAIL, 'abc')).toEqual({
      ok: false,
      message: 'Not a valid email',
    });
    expect(convert(PropertyType.PHONE, '12ab')).toEqual({
      ok: false,
      message: 'Not a valid phone number',
    });
  });

  it('parses numbers and rejects other text', () => {
    expect(convert(PropertyType.NUMBER, '1 200.5')).toMatchObject({
      value: 1200.5,
    });
    expect(convert(PropertyType.NUMBER, 'abc')).toEqual({
      ok: false,
      message: 'Not a number',
    });
  });

  it('reads checkbox words', () => {
    expect(convert(PropertyType.CHECKBOX, 'TRUE')).toMatchObject({
      value: true,
    });
    expect(convert(PropertyType.CHECKBOX, 'x')).toMatchObject({ value: true });
    expect(convert(PropertyType.CHECKBOX, 'no')).toMatchObject({
      value: false,
    });
    expect(convert(PropertyType.CHECKBOX, 'maybe')).toMatchObject({
      ok: false,
    });
  });

  it('matches options and reports the ones that would be created', () => {
    expect(convert(PropertyType.STATUS, 'done')).toEqual({
      ok: true,
      value: 'opt-done',
      display: 'Done',
      newOptionIds: [],
    });
    expect(convert(PropertyType.MULTI_SELECT, 'Done, Blocked, Done')).toEqual({
      ok: true,
      value: ['opt-done', 'new-Blocked'],
      display: 'Done, Blocked',
      newOptionIds: ['new-Blocked'],
    });
  });

  it('reads ISO, Vietnamese and ranged dates', () => {
    expect(convert(PropertyType.DATE, '2026-11-22')).toMatchObject({
      value: { start: '2026-11-22', end: null, timeZone: null },
    });
    expect(convert(PropertyType.DATE, '22/11/2026 09:30')).toMatchObject({
      value: {
        start: '2026-11-22T09:30',
        end: null,
        timeZone: 'Asia/Ho_Chi_Minh',
      },
      display: '2026-11-22 09:30',
    });
    expect(
      convert(PropertyType.DATE, '2026-11-11 09:00 → 2026-11-15 10:00'),
    ).toMatchObject({
      value: { start: '2026-11-11T09:00', end: '2026-11-15T10:00' },
    });
  });

  it('rejects impossible dates, reversed ranges and times without a zone', () => {
    expect(convert(PropertyType.DATE, '31/02/2026')).toMatchObject({
      ok: false,
    });
    expect(convert(PropertyType.DATE, '2026-11-15 → 2026-11-11')).toMatchObject(
      { ok: false },
    );
    expect(
      convert(PropertyType.DATE, '2026-11-15 10:00', {
        ...context,
        timeZone: null,
      }),
    ).toMatchObject({ ok: false });
  });

  it('matches people by name or email and rejects unknown or ambiguous names', () => {
    expect(convert(PropertyType.PERSON, 'LAN@test.dev, Lan')).toEqual({
      ok: true,
      value: ['u1'],
      display: 'Lan',
      newOptionIds: [],
    });
    expect(convert(PropertyType.PERSON, 'Nam')).toMatchObject({ ok: false });
    expect(convert(PropertyType.PERSON, 'Hoa')).toMatchObject({ ok: false });
  });
});
