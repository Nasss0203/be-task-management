import {
  SLACK_REPLY_ACTION_ID,
  SLACK_REPLY_CALLBACK_ID,
  SlackAuthError,
  SlackRateLimitedError,
  SlackRetryableError,
} from '../../application/ports/slack-client.port';
import { FetchSlackClient } from './fetch-slack-client';

const jsonResponse = (
  status: number,
  body: unknown = {},
  headers: Record<string, string> = {},
) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
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

  it('asks for the message, command and link bot scopes with the signed state', () => {
    const url = new URL(client.buildAuthorizeUrl('state-1'));

    expect(url.origin + url.pathname).toBe(
      'https://slack.com/oauth/v2/authorize',
    );
    expect(url.searchParams.get('scope')).toBe(
      'chat:write,commands,links:read,links:write',
    );
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
        scope: 'chat:write,commands',
        team: { id: 'T1', name: 'Acme' },
        authed_user: { id: 'U1' },
      }),
    );

    await expect(client.exchangeCode('code-1')).resolves.toEqual({
      botToken: 'xoxb-1',
      teamId: 'T1',
      teamName: 'Acme',
      slackUserId: 'U1',
      grantedScopes: ['chat:write', 'commands'],
    });
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://slack.com/api/oauth.v2.access',
    );
  });

  it('posts the message to the user DM with the bot token', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { ok: true }));

    await client.postDirectMessage('xoxb-1', 'U1', 'Hello', null);

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

  it.each([
    [
      { unfurlId: 'unfurl-1', source: 'composer' },
      { unfurl_id: 'unfurl-1', source: 'composer' },
    ],
    [
      { channel: 'C1', messageTs: '123.456' },
      { channel: 'C1', ts: '123.456' },
    ],
  ])('attaches link previews to the shared message', async (target, sent) => {
    fetchMock.mockResolvedValue(jsonResponse(200, { ok: true }));
    const unfurls = {
      'https://app.example/page/1': {
        blocks: [
          {
            type: 'section' as const,
            text: { type: 'mrkdwn' as const, text: '*Roadmap*' },
          },
        ],
      },
    };

    await client.unfurlLinks('xoxb-1', target, unfurls);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://slack.com/api/chat.unfurl');
    expect(JSON.parse(init.body as string)).toEqual({ ...sent, unfurls });
  });

  it('adds a Reply on page button for comment notifications', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { ok: true }));

    await client.postDirectMessage('xoxb-1', 'U1', '*Nam*', 'comment-1');

    const body = JSON.parse(fetchMock.mock.calls[0][1].body as string) as {
      text: string;
      blocks: { elements: unknown[] }[];
    };
    expect(body.text).toBe('*Nam*');
    expect(body.blocks[1].elements[0]).toEqual(
      expect.objectContaining({
        action_id: SLACK_REPLY_ACTION_ID,
        value: 'comment-1',
      }),
    );
  });

  it('opens the reply modal for the comment', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { ok: true }));

    await client.openReplyModal('xoxb-1', 'trigger-1', 'comment-1');

    const [url, init] = fetchMock.mock.calls[0];
    const body = JSON.parse(init.body as string) as {
      trigger_id: string;
      view: { blocks: { element?: { max_length: number } }[] };
    };
    expect(url).toBe('https://slack.com/api/views.open');
    expect(body.trigger_id).toBe('trigger-1');
    expect(body.view).toEqual(
      expect.objectContaining({
        callback_id: SLACK_REPLY_CALLBACK_ID,
        private_metadata: 'comment-1',
      }),
    );
    expect(body.view.blocks[1].element?.max_length).toBeLessThanOrEqual(3000);
  });

  it('treats a revoked token reported with HTTP 200 as an auth error', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(200, { ok: false, error: 'token_revoked' }),
    );

    await expect(
      client.postDirectMessage('xoxb-1', 'U1', 'Hi', null),
    ).rejects.toBeInstanceOf(SlackAuthError);
  });

  it('tells the job how long Slack asked it to wait', async () => {
    fetchMock.mockResolvedValue(jsonResponse(429, {}, { 'Retry-After': '30' }));

    const error = await client
      .postDirectMessage('xoxb-1', 'U1', 'Hi', null)
      .catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(SlackRateLimitedError);
    expect((error as SlackRateLimitedError).retryAfterMs).toBe(30_000);
  });

  it.each([
    ['rate limited without Retry-After', jsonResponse(429)],
    [
      'rate limited with an unreadable Retry-After',
      jsonResponse(429, {}, { 'Retry-After': 'soon' }),
    ],
    ['Slack down', jsonResponse(503, {}, { 'Retry-After': '30' })],
    [
      'unknown Slack error',
      jsonResponse(200, { ok: false, error: 'internal_error' }),
    ],
  ])('lets the job retry when %s', async (_label, response) => {
    fetchMock.mockResolvedValue(response);

    const error = await client
      .postDirectMessage('xoxb-1', 'U1', 'Hi', null)
      .catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(SlackRetryableError);
    expect(error).not.toBeInstanceOf(SlackRateLimitedError);
  });
});
