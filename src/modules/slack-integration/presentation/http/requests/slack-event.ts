import type { SlackUnfurlTarget } from '../../../application/ports/slack-client.port';

type RawSlackEvent = {
  type?: unknown;
  challenge?: unknown;
  team_id?: unknown;
  event_id?: unknown;
  event?: {
    type?: unknown;
    user?: unknown;
    channel?: unknown;
    message_ts?: unknown;
    unfurl_id?: unknown;
    source?: unknown;
    links?: { url?: unknown }[];
  };
};

export type SlackEvent =
  | { kind: 'url-verification'; challenge: string }
  | {
      kind: 'link-shared';
      eventId: string;
      slackTeamId: string;
      slackUserId: string;
      target: SlackUnfurlTarget;
      urls: string[];
    };

const text = (value: unknown): string | null =>
  typeof value === 'string' && value ? value : null;

const targetOf = (
  event: NonNullable<RawSlackEvent['event']>,
): SlackUnfurlTarget | null => {
  const unfurlId = text(event.unfurl_id);
  const source = text(event.source);
  if (unfurlId && source) {
    return { unfurlId, source };
  }

  const channel = text(event.channel);
  const messageTs = text(event.message_ts);
  return channel && messageTs && channel !== 'COMPOSER'
    ? { channel, messageTs }
    : null;
};

export const parseSlackEvent = (body: unknown): SlackEvent | null => {
  if (!body || typeof body !== 'object') {
    return null;
  }
  const raw = body as RawSlackEvent;

  if (raw.type === 'url_verification') {
    const challenge = text(raw.challenge);
    return challenge ? { kind: 'url-verification', challenge } : null;
  }

  const event = raw.event;
  if (raw.type !== 'event_callback' || event?.type !== 'link_shared') {
    return null;
  }

  const eventId = text(raw.event_id);
  const slackTeamId = text(raw.team_id);
  const slackUserId = text(event.user);
  const target = targetOf(event);
  const urls = Array.isArray(event.links)
    ? event.links.map((link) => text(link?.url)).filter((url) => url !== null)
    : [];

  return eventId && slackTeamId && slackUserId && target && urls.length
    ? { kind: 'link-shared', eventId, slackTeamId, slackUserId, target, urls }
    : null;
};
