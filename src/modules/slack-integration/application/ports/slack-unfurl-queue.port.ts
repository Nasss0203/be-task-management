import type { UnfurlSlackLinksCommand } from '../commands/unfurl-slack-links/unfurl-slack-links.command';

export interface SlackUnfurlQueue {
  enqueue(eventId: string, command: UnfurlSlackLinksCommand): Promise<void>;
}
