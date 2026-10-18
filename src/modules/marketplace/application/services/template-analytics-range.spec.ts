import { BadRequestException } from '@nestjs/common';

import {
  ANALYTICS_TIME_ZONE,
  resolveAnalyticsRange,
  toAnalyticsDate,
} from './template-analytics-range';

describe('template analytics range', () => {
  // 18:30 UTC on Oct 18 is already Oct 19 in Vietnam (UTC+7).
  const now = new Date('2026-10-18T18:30:00.000Z');

  it('uses Vietnam calendar days', () => {
    expect(toAnalyticsDate(now)).toBe('2026-10-19');
    expect(toAnalyticsDate(new Date('2026-10-18T16:59:59.000Z'))).toBe(
      '2026-10-18',
    );
  });

  it('treats no bounds as all-time up to today', () => {
    expect(resolveAnalyticsRange(undefined, undefined, now)).toEqual({
      from: null,
      to: '2026-10-19',
      timeZone: ANALYTICS_TIME_ZONE,
    });
  });

  it('keeps an inclusive custom range, including a single day', () => {
    expect(resolveAnalyticsRange('2026-09-20', '2026-10-19', now)).toEqual({
      from: '2026-09-20',
      to: '2026-10-19',
      timeZone: ANALYTICS_TIME_ZONE,
    });
    expect(resolveAnalyticsRange('2026-10-19', '2026-10-19', now).from).toBe(
      '2026-10-19',
    );
  });

  it.each([
    ['2026-10-01', undefined, 'together'],
    [undefined, '2026-10-01', 'together'],
    ['2026-10-02', '2026-10-01', 'after'],
    ['2026-02-30', '2026-03-01', 'Invalid date'],
    ['2025-01-01', '2026-01-02', 'exceed'],
  ])('rejects from=%s to=%s', (from, to, message) => {
    const call = () => resolveAnalyticsRange(from, to, now);
    expect(call).toThrow(BadRequestException);
    expect(call).toThrow(message);
  });

  it('accepts exactly the maximum span', () => {
    expect(() =>
      resolveAnalyticsRange('2025-01-01', '2026-01-01', now),
    ).not.toThrow();
  });
});
