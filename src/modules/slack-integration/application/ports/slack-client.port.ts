export interface SlackOAuthResult {
  botToken: string;
  teamId: string;
  teamName: string;
  slackUserId: string;
}

export class SlackAuthError extends Error {}

export class SlackRetryableError extends Error {}

export interface SlackClient {
  buildAuthorizeUrl(state: string): string;
  exchangeCode(code: string): Promise<SlackOAuthResult>;
  postDirectMessage(
    botToken: string,
    slackUserId: string,
    text: string,
  ): Promise<void>;
}
