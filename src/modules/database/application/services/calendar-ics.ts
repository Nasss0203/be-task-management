import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

import {
  DATE_KEY,
  DATE_TIME_KEY,
  isTimeZone,
} from '../../domain/aggregates/row/date-row-value';
import type { DatabaseRow } from '../../domain/aggregates/row/database-row.aggregate';
import type { DateRowValue } from '../../domain/aggregates/row/row-value.type';

dayjs.extend(utc);
dayjs.extend(timezone);

const DEFAULT_EVENT_MINUTES = 60;

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

export type TimedRange = {
  start: string;
  end: string;
  timeZone: string;
};

export type CalendarEntry = {
  rowId: string;
  title: string;
  startDate: string;
  endDateExclusive: string;
  timed: TimedRange | null;
};

export const zonedDateTimeToDate = (local: string, timeZone: string): Date =>
  dayjs.tz(local, timeZone).toDate();

const toTimedRange = (value: unknown): TimedRange | null => {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return null;
  }

  const { start, end, timeZone } = value as DateRowValue;

  if (
    typeof start !== 'string' ||
    !DATE_TIME_KEY.test(start) ||
    !isTimeZone(timeZone)
  ) {
    return null;
  }

  return {
    start,
    end:
      typeof end === 'string' && DATE_TIME_KEY.test(end) && end > start
        ? end
        : dayjs
            .utc(start)
            .add(DEFAULT_EVENT_MINUTES, 'minute')
            .format('YYYY-MM-DDTHH:mm'),
    timeZone,
  };
};

const utcStamp = (date: Date) =>
  `${date.toISOString().replace(/[-:]/g, '').slice(0, 15)}Z`;

export function collectCalendarEntries(input: {
  titlePropertyId: string | null;
  datePropertyId: string;
  rows: readonly DatabaseRow[];
}): CalendarEntry[] {
  const entries: CalendarEntry[] = [];

  for (const row of input.rows) {
    const valueOf = (propertyId: string | null) =>
      row
        .getValues()
        .find((v) => v.getPropertyId() === propertyId)
        ?.getValue();

    const date = valueOf(input.datePropertyId);
    const titleValue = valueOf(input.titlePropertyId);
    const title =
      typeof titleValue === 'string' && titleValue.trim()
        ? titleValue
        : 'Untitled';
    const timed = toTimedRange(date);

    if (timed) {
      entries.push({
        rowId: row.getId(),
        title,
        startDate: timed.start.slice(0, 10),
        endDateExclusive: nextDay(timed.end.slice(0, 10)),
        timed,
      });
      continue;
    }

    if (!isDateValue(date)) continue;

    const end =
      date.end && DATE_KEY.test(date.end) && date.end > date.start
        ? date.end
        : date.start;

    entries.push({
      rowId: row.getId(),
      title,
      startDate: date.start,
      endDateExclusive: nextDay(end),
      timed: null,
    });
  }

  return entries;
}

export function buildCalendarIcs(input: {
  name: string;
  titlePropertyId: string | null;
  datePropertyId: string;
  rows: readonly DatabaseRow[];
  now: Date;
}): string {
  const stamp = utcStamp(input.now);
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Taskmanly//Calendar feed//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeText(input.name)}`,
  ];

  for (const entry of collectCalendarEntries(input)) {
    lines.push(
      'BEGIN:VEVENT',
      `UID:${entry.rowId}@taskmanly`,
      `DTSTAMP:${stamp}`,
      ...(entry.timed
        ? [
            `DTSTART:${utcStamp(zonedDateTimeToDate(entry.timed.start, entry.timed.timeZone))}`,
            `DTEND:${utcStamp(zonedDateTimeToDate(entry.timed.end, entry.timed.timeZone))}`,
          ]
        : [
            `DTSTART;VALUE=DATE:${compact(entry.startDate)}`,
            `DTEND;VALUE=DATE:${compact(entry.endDateExclusive)}`,
          ]),
      `SUMMARY:${escapeText(entry.title)}`,
      'END:VEVENT',
    );
  }

  lines.push('END:VCALENDAR');
  return `${lines.map(fold).join('\r\n')}\r\n`;
}
