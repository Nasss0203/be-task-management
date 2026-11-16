import {
  GoogleCalendarAccessRevokedError,
  GoogleCalendarNotFoundError,
  GoogleCalendarRateLimitError,
  GoogleCalendarRequestError,
} from '../../application/ports/google-calendar-client.port';
import { FetchGoogleCalendarClient } from './fetch-google-calendar-client';

const CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar.app.created';

const jsonResponse = (status: number, body: unknown = {}) =>
  new Response(status === 204 ? null : JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

const idToken = (claims: object) =>
  `header.${Buffer.from(JSON.stringify(claims)).toString('base64url')}.sig`;

describe('FetchGoogleCalendarClient', () => {
  const config: Record<string, string> = {
    GOOGLE_CLIENT_ID: 'client-id',
    GOOGLE_CLIENT_SECRET: 'client-secret',
    GOOGLE_CALENDAR_REDIRECT_URI: 'http://localhost:8080/callback',
  };
  const client = new FetchGoogleCalendarClient({
    getOrThrow: (key: string) => config[key],
  } as never);
  const fetchMock = jest.fn<Promise<Response>, [string, RequestInit]>();
  const originalFetch = global.fetch;

  beforeAll(() => {
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  beforeEach(() => fetchMock.mockReset());

  it('asks for offline access to app-created calendars only', () => {
    const url = new URL(client.buildAuthorizeUrl('state-1'));

    expect(url.origin + url.pathname).toBe(
      'https://accounts.google.com/o/oauth2/v2/auth',
    );
    expect(url.searchParams.get('scope')).toBe(
      `openid email ${CALENDAR_SCOPE}`,
    );
    expect(url.searchParams.get('access_type')).toBe('offline');
    expect(url.searchParams.get('prompt')).toBe('consent');
    expect(url.searchParams.get('state')).toBe('state-1');
    expect(url.searchParams.get('redirect_uri')).toBe(
      'http://localhost:8080/callback',
    );
  });

  it('exchanges the code for a refresh token and the Google email', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(200, {
        refresh_token: 'refresh-1',
        scope: `openid ${CALENDAR_SCOPE} email`,
        id_token: idToken({ email: 'me@example.com' }),
      }),
    );

    await expect(client.exchangeCode('code-1')).resolves.toEqual({
      refreshToken: 'refresh-1',
      email: 'me@example.com',
    });
    const body = fetchMock.mock.calls[0][1].body as URLSearchParams;
    expect(body.get('grant_type')).toBe('authorization_code');
    expect(body.get('client_secret')).toBe('client-secret');
  });

  it.each([
    ['no refresh token', { scope: CALENDAR_SCOPE }],
    [
      'the calendar scope unticked',
      { refresh_token: 'r', scope: 'openid email' },
    ],
  ])('rejects a grant with %s', async (_label, body) => {
    fetchMock.mockResolvedValue(
      jsonResponse(200, { ...body, id_token: idToken({ email: 'a@b.c' }) }),
    );

    await expect(client.exchangeCode('code-1')).rejects.toBeInstanceOf(
      GoogleCalendarRequestError,
    );
  });

  it('reports a revoked refresh token', async () => {
    fetchMock.mockResolvedValue(jsonResponse(400, { error: 'invalid_grant' }));

    await expect(client.refreshAccessToken('refresh-1')).rejects.toBeInstanceOf(
      GoogleCalendarAccessRevokedError,
    );
  });

  it('reads every page of events including deleted ones', async () => {
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse(200, { items: [{ id: 'a' }], nextPageToken: 'p2' }),
      )
      .mockResolvedValueOnce(jsonResponse(200, { items: [{ id: 'b' }] }));

    const events = await client.listEvents(
      'token',
      'abc@group.calendar.google.com',
    );

    expect(events.map((event) => event.id)).toEqual(['a', 'b']);
    const firstUrl = new URL(fetchMock.mock.calls[0][0]);
    expect(firstUrl.pathname).toBe(
      '/calendar/v3/calendars/abc%40group.calendar.google.com/events',
    );
    expect(firstUrl.searchParams.get('showDeleted')).toBe('true');
    expect(
      new URL(fetchMock.mock.calls[1][0]).searchParams.get('pageToken'),
    ).toBe('p2');
  });

  it('reports a calendar deleted in Google', async () => {
    fetchMock.mockResolvedValue(jsonResponse(404));

    await expect(
      client.listEvents('token', 'calendar-1'),
    ).rejects.toBeInstanceOf(GoogleCalendarNotFoundError);
  });

  it('updates the event when its id already exists', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(409))
      .mockResolvedValueOnce(jsonResponse(200, { id: 'abc12' }));

    await client.insertEvent('token', 'calendar-1', {
      id: 'abc12',
      summary: 'Launch',
      description: 'Status: Done',
      startDate: '2026-11-10',
      endDateExclusive: '2026-11-11',
    });

    expect(fetchMock.mock.calls[1][1].method).toBe('PUT');
    expect(JSON.parse(fetchMock.mock.calls[1][1].body as string)).toEqual({
      id: 'abc12',
      status: 'confirmed',
      summary: 'Launch',
      description: 'Status: Done',
      transparency: 'transparent',
      start: { date: '2026-11-10' },
      end: { date: '2026-11-11' },
    });
  });

  it('sends a timed event with its time zone instead of all-day dates', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(200, { id: 'abc12' }));

    await client.insertEvent('token', 'calendar-1', {
      id: 'abc12',
      summary: 'Launch',
      description: '',
      startDate: '2026-11-20',
      endDateExclusive: '2026-11-21',
      timed: {
        start: '2026-11-20T09:00',
        end: '2026-11-20T10:30',
        timeZone: 'Asia/Ho_Chi_Minh',
      },
    });

    const body = JSON.parse(fetchMock.mock.calls[0][1].body as string) as {
      start: unknown;
      end: unknown;
    };
    expect(body.start).toEqual({
      dateTime: '2026-11-20T09:00:00',
      timeZone: 'Asia/Ho_Chi_Minh',
    });
    expect(body.end).toEqual({
      dateTime: '2026-11-20T10:30:00',
      timeZone: 'Asia/Ho_Chi_Minh',
    });
  });

  it.each([404, 410])(
    'treats an event already gone (%i) as deleted',
    async (status) => {
      fetchMock.mockResolvedValue(jsonResponse(status));

      await expect(
        client.deleteEvent('token', 'calendar-1', 'abc12'),
      ).resolves.toBeUndefined();
    },
  );

  it.each([
    [429, 'rateLimitExceeded'],
    [403, 'userRateLimitExceeded'],
    [403, 'quotaExceeded'],
  ])('reports %i %s as a rate limit', async (status, reason) => {
    fetchMock.mockResolvedValue(
      jsonResponse(status, {
        error: { errors: [{ domain: 'usageLimits', reason }], code: status },
      }),
    );

    await expect(
      client.insertEvent('token', 'calendar-1', {
        id: 'abc12',
        summary: 'Launch',
        description: '',
        startDate: '2026-11-10',
        endDateExclusive: '2026-11-11',
      }),
    ).rejects.toMatchObject({
      constructor: GoogleCalendarRateLimitError,
      status,
    });
  });

  it('keeps a 403 that is not about usage limits as a plain Google failure', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(403, {
        error: { errors: [{ domain: 'global', reason: 'forbidden' }] },
      }),
    );

    const error = await client
      .deleteEvent('token', 'calendar-1', 'abc12')
      .catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(GoogleCalendarRequestError);
    expect(error).not.toBeInstanceOf(GoogleCalendarRateLimitError);
  });

  it('surfaces other Google failures', async () => {
    fetchMock.mockResolvedValue(jsonResponse(503));

    await expect(
      client.deleteEvent('token', 'calendar-1', 'abc12'),
    ).rejects.toMatchObject({ status: 503 });
  });
});
