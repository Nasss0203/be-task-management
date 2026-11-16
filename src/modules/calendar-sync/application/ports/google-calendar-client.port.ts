export type GoogleCalendarEvent = {
  id: string;
  status: string;
  summary?: string;
  description?: string;
  transparency?: string;
  start?: { date?: string; dateTime?: string; timeZone?: string };
  end?: { date?: string; dateTime?: string; timeZone?: string };
};

export type GoogleCalendarEventInput = {
  id: string;
  summary: string;
  description: string;
  startDate: string;
  endDateExclusive: string;
  timed?: { start: string; end: string; timeZone: string } | null;
};

export class GoogleCalendarAccessRevokedError extends Error {
  constructor() {
    super('Google Calendar access was revoked');
  }
}

export class GoogleCalendarNotFoundError extends Error {
  constructor() {
    super('Google calendar not found');
  }
}

export class GoogleCalendarRequestError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

export interface GoogleCalendarClient {
  buildAuthorizeUrl(state: string): string;
  exchangeCode(code: string): Promise<{ refreshToken: string; email: string }>;
  refreshAccessToken(refreshToken: string): Promise<string>;
  revoke(refreshToken: string): Promise<void>;
  createCalendar(accessToken: string, summary: string): Promise<string>;
  deleteCalendar(accessToken: string, calendarId: string): Promise<void>;
  listEvents(
    accessToken: string,
    calendarId: string,
  ): Promise<GoogleCalendarEvent[]>;
  insertEvent(
    accessToken: string,
    calendarId: string,
    event: GoogleCalendarEventInput,
  ): Promise<void>;
  updateEvent(
    accessToken: string,
    calendarId: string,
    event: GoogleCalendarEventInput,
  ): Promise<void>;
  deleteEvent(
    accessToken: string,
    calendarId: string,
    eventId: string,
  ): Promise<void>;
}
