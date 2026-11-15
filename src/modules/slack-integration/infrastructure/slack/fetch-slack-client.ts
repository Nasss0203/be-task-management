import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { COMMENT_BODY_MAX_LENGTH } from 'src/modules/comments/application/dto/comment/request/create-comment.request.dto';

import {
  SLACK_BOT_SCOPES,
  SLACK_REPLY_ACTION_ID,
  SLACK_REPLY_BLOCK_ID,
  SLACK_REPLY_CALLBACK_ID,
  SLACK_REPLY_INPUT_ID,
  SlackAuthError,
  type SlackClient,
  type SlackOAuthResult,
  SlackRateLimitedError,
  SlackRetryableError,
} from '../../application/ports/slack-client.port';

const AUTHORIZE_URL = 'https://slack.com/oauth/v2/authorize';
const API_URL = 'https://slack.com/api';
const REQUEST_TIMEOUT_MS = 15_000;
const SECTION_TEXT_MAX_LENGTH = 3000;
const REPLY_INPUT_MAX_LENGTH = Math.min(COMMENT_BODY_MAX_LENGTH, 3000);
const AUTH_ERRORS = new Set([
  'invalid_auth',
  'not_authed',
  'token_revoked',
  'account_inactive',
  'invalid_code',
  'bad_redirect_uri',
]);

type SlackResponse = {
  ok: boolean;
  error?: string;
  access_token?: string;
  scope?: string;
  team?: { id: string; name: string };
  authed_user?: { id: string };
};

@Injectable()
export class FetchSlackClient implements SlackClient {
  constructor(private readonly configService: ConfigService) {}

  buildAuthorizeUrl(state: string): string {
    const url = new URL(AUTHORIZE_URL);

    url.search = new URLSearchParams({
      client_id: this.configService.getOrThrow<string>('SLACK_CLIENT_ID'),
      scope: SLACK_BOT_SCOPES.join(','),
      redirect_uri: this.redirectUri(),
      state,
    }).toString();

    return url.toString();
  }

  async exchangeCode(code: string): Promise<SlackOAuthResult> {
    const body = await this.call('oauth.v2.access', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: this.configService.getOrThrow<string>('SLACK_CLIENT_ID'),
        client_secret: this.configService.getOrThrow<string>(
          'SLACK_CLIENT_SECRET',
        ),
        code,
        redirect_uri: this.redirectUri(),
      }),
    });

    if (!body.access_token || !body.team || !body.authed_user) {
      throw new SlackAuthError('Slack did not return a bot token');
    }

    return {
      botToken: body.access_token,
      teamId: body.team.id,
      teamName: body.team.name,
      slackUserId: body.authed_user.id,
      grantedScopes: (body.scope ?? '').split(',').filter(Boolean),
    };
  }

  async postDirectMessage(
    botToken: string,
    slackUserId: string,
    text: string,
    replyCommentId: string | null,
  ): Promise<void> {
    const blocks = replyCommentId
      ? [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: text.slice(0, SECTION_TEXT_MAX_LENGTH),
            },
          },
          {
            type: 'actions',
            elements: [
              {
                type: 'button',
                action_id: SLACK_REPLY_ACTION_ID,
                text: { type: 'plain_text', text: 'Reply on page' },
                value: replyCommentId,
              },
            ],
          },
        ]
      : undefined;

    await this.callWithToken('chat.postMessage', botToken, {
      channel: slackUserId,
      text,
      blocks,
    });
  }

  async openReplyModal(
    botToken: string,
    triggerId: string,
    commentId: string,
  ): Promise<void> {
    await this.callWithToken('views.open', botToken, {
      trigger_id: triggerId,
      view: {
        type: 'modal',
        callback_id: SLACK_REPLY_CALLBACK_ID,
        private_metadata: commentId,
        title: { type: 'plain_text', text: 'Reply on page' },
        submit: { type: 'plain_text', text: 'Post reply' },
        close: { type: 'plain_text', text: 'Cancel' },
        blocks: [
          {
            type: 'context',
            elements: [
              {
                type: 'mrkdwn',
                text: 'Your reply is posted on the page, where everyone who can see the comment can read it.',
              },
            ],
          },
          {
            type: 'input',
            block_id: SLACK_REPLY_BLOCK_ID,
            label: { type: 'plain_text', text: 'Reply' },
            element: {
              type: 'plain_text_input',
              action_id: SLACK_REPLY_INPUT_ID,
              multiline: true,
              max_length: REPLY_INPUT_MAX_LENGTH,
            },
          },
        ],
      },
    });
  }

  private callWithToken(
    method: string,
    botToken: string,
    payload: Record<string, unknown>,
  ): Promise<SlackResponse> {
    return this.call(method, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${botToken}`,
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify(payload),
    });
  }

  private redirectUri(): string {
    return this.configService.getOrThrow<string>('SLACK_REDIRECT_URI');
  }

  private async call(
    method: string,
    init: RequestInit,
  ): Promise<SlackResponse> {
    const response = await fetch(`${API_URL}/${method}`, {
      ...init,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (!response.ok) {
      const failure = `Slack ${method} failed: ${response.status}`;
      const retryAfterSeconds = Number(response.headers.get('retry-after'));

      throw response.status === 429 &&
        Number.isInteger(retryAfterSeconds) &&
        retryAfterSeconds > 0
        ? new SlackRateLimitedError(failure, retryAfterSeconds * 1000)
        : new SlackRetryableError(failure);
    }

    const body = (await response.json()) as SlackResponse;

    if (body.ok) {
      return body;
    }

    const message = `Slack ${method} failed: ${body.error}`;

    throw AUTH_ERRORS.has(body.error ?? '')
      ? new SlackAuthError(message)
      : new SlackRetryableError(message);
  }
}
