import { BadRequestException } from '@nestjs/common';

import type { TemplateAnalyticsRange } from '../ports/template-analytics-reader.port';

/** The marketplace sells in VND only, so creator days follow Vietnam time. */
export const ANALYTICS_TIME_ZONE = 'Asia/Ho_Chi_Minh';

/** Bounds a custom range so the daily series stays small (covers the 90-day preset). */
export const MAX_ANALYTICS_RANGE_DAYS = 366;

const DAY_MS = 86_400_000;

/** Calendar date (YYYY-MM-DD) of an instant in the analytics time zone. */
export function toAnalyticsDate(instant: Date): string {
  // en-CA formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: ANALYTICS_TIME_ZONE,
  }).format(instant);
}

/**
 * Turns optional `from`/`to` calendar dates (inclusive) into a reader range.
 * Neither given means all-time up to today.
 */
export function resolveAnalyticsRange(
  from: string | undefined,
  to: string | undefined,
  now: Date = new Date(),
): TemplateAnalyticsRange {
  if (!from && !to) {
    return {
      from: null,
      to: toAnalyticsDate(now),
      timeZone: ANALYTICS_TIME_ZONE,
    };
  }

  if (!from || !to) {
    throw new BadRequestException('from and to must be provided together');
  }

  const fromMs = parseCalendarDate(from);
  const toMs = parseCalendarDate(to);

  if (fromMs > toMs) {
    throw new BadRequestException('from must not be after to');
  }

  if ((toMs - fromMs) / DAY_MS + 1 > MAX_ANALYTICS_RANGE_DAYS) {
    throw new BadRequestException(
      `Range must not exceed ${MAX_ANALYTICS_RANGE_DAYS} days`,
    );
  }

  return { from, to, timeZone: ANALYTICS_TIME_ZONE };
}

function parseCalendarDate(value: string): number {
  const ms = Date.parse(`${value}T00:00:00.000Z`);

  // Rejects shapes like 2026-02-30 that Date would silently roll over.
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
    Number.isNaN(ms) ||
    new Date(ms).toISOString().slice(0, 10) !== value
  ) {
    throw new BadRequestException(`Invalid date: ${value}`);
  }

  return ms;
}
