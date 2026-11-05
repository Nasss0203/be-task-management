import { DatabaseRow } from '../../domain/aggregates/row/database-row.aggregate';
import { RowValue } from '../../domain/aggregates/row/row-value.entity';
import type { RowValueData } from '../../domain/aggregates/row/row-value.type';
import { buildCalendarIcs } from './calendar-ics';

function row(id: string, title: RowValueData, date: RowValueData) {
  return DatabaseRow.restore({
    id,
    databaseId: 'db',
    values: [
      new RowValue(`${id}-title`, id, 'title', title),
      new RowValue(`${id}-date`, id, 'due', date),
    ],
  });
}

function build(rows: DatabaseRow[]) {
  return buildCalendarIcs({
    name: 'Sprint, Q4',
    titlePropertyId: 'title',
    datePropertyId: 'due',
    rows,
    now: new Date('2026-11-05T08:30:00.000Z'),
  });
}

describe('buildCalendarIcs', () => {
  it('writes all-day events with an exclusive end date', () => {
    const ics = build([
      row('r1', 'Ship', { start: '2026-11-05' }),
      row('r2', 'Trip', { start: '2026-12-30', end: '2027-01-01' }),
    ]);

    expect(ics).toContain('UID:r1@taskmanly');
    expect(ics).toContain('DTSTAMP:20261105T083000Z');
    expect(ics).toContain(
      'DTSTART;VALUE=DATE:20261105\r\nDTEND;VALUE=DATE:20261106',
    );
    expect(ics).toContain(
      'DTSTART;VALUE=DATE:20261230\r\nDTEND;VALUE=DATE:20270102',
    );
    expect(ics).toContain('X-WR-CALNAME:Sprint\\, Q4');
  });

  it('escapes titles and skips rows without a valid date', () => {
    const ics = build([
      row('r1', 'A, B; C\nD', { start: '2026-11-05' }),
      row('r2', '  ', { start: '2026-11-06', end: '2026-11-01' }),
      row('r3', 'No date', null),
      row('r4', 'Bad date', { start: '05/11/2026' }),
    ]);

    expect(ics).toContain('SUMMARY:A\\, B\\; C\\nD');
    expect(ics).toContain('SUMMARY:Untitled');
    expect(ics).toContain(
      'DTSTART;VALUE=DATE:20261106\r\nDTEND;VALUE=DATE:20261107',
    );
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(2);
  });

  it('uses CRLF and folds long lines within 75 bytes', () => {
    const ics = build([
      row('r1', 'Lên kế hoạch '.repeat(12), { start: '2026-11-05' }),
    ]);
    const lines = ics.split('\r\n');

    expect(ics.startsWith('BEGIN:VCALENDAR\r\n')).toBe(true);
    expect(ics.endsWith('END:VCALENDAR\r\n')).toBe(true);
    expect(ics).not.toMatch(/[^\r]\n/);
    expect(lines.some((line) => line.startsWith(' '))).toBe(true);
    expect(lines.every((line) => Buffer.byteLength(line) <= 75)).toBe(true);
  });
});
