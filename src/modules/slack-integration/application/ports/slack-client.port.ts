export const SLACK_BOT_SCOPES = [
  'chat:write',
  'commands',
  'links:read',
  'links:write',
] as const;

export const SLACK_LEGACY_BOT_SCOPES = ['chat:write'];

export interface SlackOAuthResult {
  botToken: string;
  teamId: string;
  teamName: string;
  slackUserId: string;
  grantedScopes: string[];
}

export const SLACK_REPLY_ACTION_ID = 'reply_on_page';
export const SLACK_REPLY_CALLBACK_ID = 'reply_on_page_submit';
export const SLACK_REPLY_BLOCK_ID = 'reply';
export const SLACK_REPLY_INPUT_ID = 'body';

export class SlackAuthError extends Error {}

export class SlackRetryableError extends Error {}

export class SlackRateLimitedError extends SlackRetryableError {
  constructor(
    message: string,
    readonly retryAfterMs: number,
  ) {
    super(message);
  }
}

export type SlackUnfurlTarget =
  | { unfurlId: string; source: string }
  | { channel: string; messageTs: string };

export type SlackUnfurl = {
  blocks: { type: 'section'; text: { type: 'mrkdwn'; text: string } }[];
};

export interface SlackClient {
  buildAuthorizeUrl(state: string): string;
  exchangeCode(code: string): Promise<SlackOAuthResult>;
  postDirectMessage(
    botToken: string,
    slackUserId: string,
    text: string,
    replyCommentId: string | null,
  ): Promise<void>;
  openReplyModal(
    botToken: string,
    triggerId: string,
    commentId: string,
  ): Promise<void>;
  unfurlLinks(
    botToken: string,
    target: SlackUnfurlTarget,
    unfurls: Record<string, SlackUnfurl>,
  ): Promise<void>;
}
