import type { SlackUnfurlTarget } from '../../ports/slack-client.port';

export class UnfurlSlackLinksCommand {
  constructor(
    readonly slackTeamId: string,
    readonly slackUserId: string,
    readonly target: SlackUnfurlTarget,
    readonly urls: string[],
  ) {}
}
