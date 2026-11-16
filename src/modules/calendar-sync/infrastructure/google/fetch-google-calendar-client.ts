import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import {
  GoogleCalendarAccessRevokedError,
  type GoogleCalendarClient,
  type GoogleCalendarEvent,
  type GoogleCalendarEventInput,
  GoogleCalendarNotFoundError,
  GoogleCalendarRequestError,
} from '../../application/ports/google-calendar-client.port';

const AUTHORIZE_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const REVOKE_URL = 'https://oauth2.googleapis.com/revoke';
const CALENDAR_API = 'https://www.googleapis.com/calendar/v3';
const CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar.app.created';
const REQUEST_TIMEOUT_MS = 15_000;

type TokenResponse = {
  access_token?: string;
  refresh_token?: string;
  id_token?: string;
  scope?: string;
  error?: string;
};

type EventListResponse = {
  items?: GoogleCalendarEvent[];
  nextPageToken?: string;
};

@Injectable()
export class FetchGoogleCalendarClient implements GoogleCalendarClient {
  constructor(private readonly configService: ConfigService) {}

  buildAuthorizeUrl(state: string): string {
    const url = new URL(AUTHORIZE_URL);

    url.search = new URLSearchParams({
      client_id: this.configService.getOrThrow<string>('GOOGLE_CLIENT_ID'),
      redirect_uri: this.redirectUri(),
      response_type: 'code',
      scope: ['openid', 'email', CALENDAR_SCOPE].join(' '),
      access_type: 'offline',
      prompt: 'consent',
      state,
    }).toString();

    return url.toString();
  }

  async exchangeCode(
    code: string,
  ): Promise<{ refreshToken: string; email: string }> {
    const body = await this.requestToken({
      code,
      grant_type: 'authorization_code',
      redirect_uri: this.redirectUri(),
    });

    const scopes = body.scope?.split(' ') ?? [];
    const email = this.readEmail(body.id_token);

    if (!body.refresh_token || !scopes.includes(CALENDAR_SCOPE) || !email) {
      throw new GoogleCalendarRequestError(
        400,
        'Google did not grant offline calendar access',
      );
    }

    return { refreshToken: body.refresh_token, email };
  }

  async refreshAccessToken(refreshToken: string): Promise<string> {
    const body = await this.requestToken({
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    });

    if (!body.access_token) {
      throw new GoogleCalendarRequestError(502, 'Google returned no token');
    }

    return body.access_token;
  }

  async revoke(refreshToken: string): Promise<void> {
    await fetch(REVOKE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ token: refreshToken }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  }

  async createCalendar(accessToken: string, summary: string): Promise<string> {
    const calendar = await this.callApi<{ id: string }>(
      accessToken,
      'POST',
      '/calendars',
      { summary },
    );

    return calendar.id;
  }

  async deleteCalendar(accessToken: string, calendarId: string): Promise<void> {
    await this.ignoreMissing(
      this.callApi(
        accessToken,
        'DELETE',
        `/calendars/${encodeURIComponent(calendarId)}`,
      ),
    );
  }

  async listEvents(
    accessToken: string,
    calendarId: string,
  ): Promise<GoogleCalendarEvent[]> {
    const events: GoogleCalendarEvent[] = [];
    let pageToken: string | undefined;

    do {
      const params = new URLSearchParams({
        showDeleted: 'true',
        maxResults: '2500',
      });

      if (pageToken) {
        params.set('pageToken', pageToken);
      }

      let page: EventListResponse;

      try {
        page = await this.callApi<EventListResponse>(
          accessToken,
          'GET',
          `${this.eventsPath(calendarId)}?${params.toString()}`,
        );
      } catch (error) {
        if (
          error instanceof GoogleCalendarRequestError &&
          [404, 410].includes(error.status)
        ) {
          throw new GoogleCalendarNotFoundError();
        }
        throw error;
      }

      events.push(...(page.items ?? []));
      pageToken = page.nextPageToken;
    } while (pageToken);

    return events;
  }

  async insertEvent(
    accessToken: string,
    calendarId: string,
    event: GoogleCalendarEventInput,
  ): Promise<void> {
    try {
      await this.callApi(
        accessToken,
        'POST',
        this.eventsPath(calendarId),
        this.toEventBody(event),
      );
    } catch (error) {
      if (error instanceof GoogleCalendarRequestError && error.status === 409) {
        await this.updateEvent(accessToken, calendarId, event);
        return;
      }
      throw error;
    }
  }

  async updateEvent(
    accessToken: string,
    calendarId: string,
    event: GoogleCalendarEventInput,
  ): Promise<void> {
    await this.callApi(
      accessToken,
      'PUT',
      `${this.eventsPath(calendarId)}/${encodeURIComponent(event.id)}`,
      this.toEventBody(event),
    );
  }

  async deleteEvent(
    accessToken: string,
    calendarId: string,
    eventId: string,
  ): Promise<void> {
    await this.ignoreMissing(
      this.callApi(
        accessToken,
        'DELETE',
        `${this.eventsPath(calendarId)}/${encodeURIComponent(eventId)}`,
      ),
    );
  }

  private toEventBody(event: GoogleCalendarEventInput) {
    return {
      id: event.id,
      status: 'confirmed',
      summary: event.summary,
      description: event.description,
      transparency: 'transparent',
      ...(event.timed
        ? {
            start: {
              dateTime: `${event.timed.start}:00`,
              timeZone: event.timed.timeZone,
            },
            end: {
              dateTime: `${event.timed.end}:00`,
              timeZone: event.timed.timeZone,
            },
          }
        : {
            start: { date: event.startDate },
            end: { date: event.endDateExclusive },
          }),
    };
  }

  private eventsPath(calendarId: string): string {
    return `/calendars/${encodeURIComponent(calendarId)}/events`;
  }

  private redirectUri(): string {
    return this.configService.getOrThrow<string>(
      'GOOGLE_CALENDAR_REDIRECT_URI',
    );
  }

  private readEmail(idToken: string | undefined): string | null {
    const payload = idToken?.split('.')[1];

    if (!payload) {
      return null;
    }

    try {
      const claims = JSON.parse(
        Buffer.from(payload, 'base64url').toString('utf8'),
      ) as { email?: unknown };

      return typeof claims.email === 'string' ? claims.email : null;
    } catch {
      return null;
    }
  }

  private async requestToken(
    params: Record<string, string>,
  ): Promise<TokenResponse> {
    const response = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: this.configService.getOrThrow<string>('GOOGLE_CLIENT_ID'),
        client_secret: this.configService.getOrThrow<string>(
          'GOOGLE_CLIENT_SECRET',
        ),
        ...params,
      }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    const body = (await response.json().catch(() => ({}))) as TokenResponse;

    if (!response.ok) {
      if (body.error === 'invalid_grant') {
        throw new GoogleCalendarAccessRevokedError();
      }
      throw new GoogleCalendarRequestError(
        response.status,
        body.error ?? 'Google token request failed',
      );
    }

    return body;
  }

  private async callApi<T = unknown>(
    accessToken: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    path: string,
    body?: unknown,
  ): Promise<T> {
    const response = await fetch(`${CALENDAR_API}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (!response.ok) {
      throw new GoogleCalendarRequestError(
        response.status,
        `Google Calendar ${method} ${path.split('?')[0]} failed`,
      );
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return (await response.json()) as T;
  }

  private async ignoreMissing(request: Promise<unknown>): Promise<void> {
    try {
      await request;
    } catch (error) {
      if (
        error instanceof GoogleCalendarRequestError &&
        [404, 410].includes(error.status)
      ) {
        return;
      }
      throw error;
    }
  }
}
