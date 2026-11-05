import type { DatabaseRow } from '../../domain/aggregates/row/database-row.aggregate';
import type { DateRowValue } from '../../domain/aggregates/row/row-value.type';

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;

const escapeText = (value: string) =>
  value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');

const compact = (key: string) => key.replace(/-/g, '');

const nextDay = (key: string) => {
  const date = new Date(`${key}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
};

const fold = (line: string) => {
  const parts: string[] = [];
  let rest = line;
  while (Buffer.byteLength(rest) > 75) {
    let cut = 75;
    while (Buffer.byteLength(rest.slice(0, cut)) > 75) cut--;
    parts.push(rest.slice(0, cut));
    rest = ` ${rest.slice(cut)}`;
  }
  parts.push(rest);
  return parts.join('\r\n');
};

const isDateValue = (value: unknown): value is DateRowValue =>
  typeof value === 'object' &&
  value !== null &&
  !Array.isArray(value) &&
  typeof (value as DateRowValue).start === 'string' &&
  DATE_KEY.test((value as DateRowValue).start);

export function buildCalendarIcs(input: {
  name: string;
  titlePropertyId: string | null;
  datePropertyId: string;
  rows: readonly DatabaseRow[];
  now: Date;
}): string {
  const stamp = `${input.now.toISOString().replace(/[-:]/g, '').slice(0, 15)}Z`;
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Taskmanly//Calendar feed//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeText(input.name)}`,
  ];

  for (const row of input.rows) {
    const valueOf = (propertyId: string | null) =>
      row
        .getValues()
        .find((v) => v.getPropertyId() === propertyId)
        ?.getValue();

    const date = valueOf(input.datePropertyId);
    if (!isDateValue(date)) continue;

    const end =
      date.end && DATE_KEY.test(date.end) && date.end > date.start
        ? date.end
        : date.start;
    const title = valueOf(input.titlePropertyId);

    lines.push(
      'BEGIN:VEVENT',
      `UID:${row.getId()}@taskmanly`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${compact(date.start)}`,
      `DTEND;VALUE=DATE:${compact(nextDay(end))}`,
      `SUMMARY:${escapeText(typeof title === 'string' && title.trim() ? title : 'Untitled')}`,
      'END:VEVENT',
    );
  }

  lines.push('END:VCALENDAR');
  return `${lines.map(fold).join('\r\n')}\r\n`;
}
