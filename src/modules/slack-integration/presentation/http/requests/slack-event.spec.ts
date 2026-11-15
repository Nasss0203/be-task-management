import { parseSlackEvent } from './slack-event';

describe('parseSlackEvent', () => {
  const linkShared = (event: Record<string, unknown> = {}) => ({
    type: 'event_callback',
    team_id: 'T1',
    event_id: 'Ev1',
    event: {
      type: 'link_shared',
      user: 'U1',
      channel: 'C1',
      message_ts: '123.456',
      links: [{ domain: 'app.example', url: 'https://app.example/page/1' }],
      ...event,
    },
  });

  it('answers the Request URL check', () => {
    expect(
      parseSlackEvent({ type: 'url_verification', challenge: 'abc' }),
    ).toEqual({ kind: 'url-verification', challenge: 'abc' });
  });

  it('reads a link shared in a posted message', () => {
    expect(parseSlackEvent(linkShared())).toEqual({
      kind: 'link-shared',
      eventId: 'Ev1',
      slackTeamId: 'T1',
      slackUserId: 'U1',
      target: { channel: 'C1', messageTs: '123.456' },
      urls: ['https://app.example/page/1'],
    });
  });

  it('prefers the unfurl id, which also covers links still in the composer', () => {
    expect(
      parseSlackEvent(
        linkShared({
          channel: 'COMPOSER',
          message_ts: 'unfurl-1',
          unfurl_id: 'unfurl-1',
          source: 'composer',
        }),
      ),
    ).toEqual(
      expect.objectContaining({
        target: { unfurlId: 'unfurl-1', source: 'composer' },
      }),
    );
  });

  it.each([
    [
      'a composer link without an unfurl id',
      linkShared({ channel: 'COMPOSER' }),
    ],
    ['an event without links', linkShared({ links: [] })],
    ['an event without the user', linkShared({ user: undefined })],
    ['another event type', linkShared({ type: 'message' })],
    ['a body that is not an object', 'payload'],
  ])('ignores %s', (_, body) => {
    expect(parseSlackEvent(body)).toBeNull();
  });
});
