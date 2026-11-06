import {
  SlackAuthError,
  SlackRetryableError,
} from '../../application/ports/slack-client.port';
import { FetchSlackClient } from './fetch-slack-client';

const jsonResponse = (status: number, body: unknown = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

describe('FetchSlackClient', () => {
  const config: Record<string, string> = {
    SLACK_CLIENT_ID: 'client-id',
    SLACK_CLIENT_SECRET: 'client-secret',
    SLACK_REDIRECT_URI: 'https://tunnel.example/callback',
  };
  const client = new FetchSlackClient({
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

  it('asks for the chat:write bot scope with the signed state', () => {
    const url = new URL(client.buildAuthorizeUrl('state-1'));

    expect(url.origin + url.pathname).toBe(
      'https://slack.com/oauth/v2/authorize',
    );
    expect(url.searchParams.get('scope')).toBe('chat:write');
    expect(url.searchParams.get('state')).toBe('state-1');
    expect(url.searchParams.get('redirect_uri')).toBe(
      'https://tunnel.example/callback',
    );
  });

  it('exchanges the code for the bot token, team and Slack user', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(200, {
        ok: true,
        access_token: 'xoxb-1',
        team: { id: 'T1', name: 'Acme' },
        authed_user: { id: 'U1' },
      }),
    );

    await expect(client.exchangeCode('code-1')).resolves.toEqual({
      botToken: 'xoxb-1',
      teamId: 'T1',
      teamName: 'Acme',
      slackUserId: 'U1',
    });
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://slack.com/api/oauth.v2.access',
    );
  });

  it('posts the message to the user DM with the bot token', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { ok: true }));

    await client.postDirectMessage('xoxb-1', 'U1', 'Hello');

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://slack.com/api/chat.postMessage');
    expect(init.headers).toEqual(
      expect.objectContaining({ Authorization: 'Bearer xoxb-1' }),
    );
    expect(JSON.parse(init.body as string)).toEqual({
      channel: 'U1',
      text: 'Hello',
    });
  });

  it('treats a revoked token reported with HTTP 200 as an auth error', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(200, { ok: false, error: 'token_revoked' }),
    );

    await expect(
      client.postDirectMessage('xoxb-1', 'U1', 'Hi'),
    ).rejects.toBeInstanceOf(SlackAuthError);
  });

  it.each([
    ['rate limited', jsonResponse(429)],
    ['Slack down', jsonResponse(503)],
    [
      'unknown Slack error',
      jsonResponse(200, { ok: false, error: 'internal_error' }),
    ],
  ])('lets the job retry when %s', async (_label, response) => {
    fetchMock.mockResolvedValue(response);

    await expect(
      client.postDirectMessage('xoxb-1', 'U1', 'Hi'),
    ).rejects.toBeInstanceOf(SlackRetryableError);
  });
});
