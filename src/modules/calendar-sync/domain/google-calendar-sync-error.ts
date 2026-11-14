export const GoogleCalendarSyncError = {
  ACCESS_REVOKED: 'ACCESS_REVOKED',
  ACCESS_LOST: 'ACCESS_LOST',
  DATE_PROPERTY_MISSING: 'DATE_PROPERTY_MISSING',
  CALENDAR_MISSING: 'CALENDAR_MISSING',
  GOOGLE_ERROR: 'GOOGLE_ERROR',
} as const;

export type GoogleCalendarSyncError =
  (typeof GoogleCalendarSyncError)[keyof typeof GoogleCalendarSyncError];
