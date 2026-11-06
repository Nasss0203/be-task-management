import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import {
  SlackAuthError,
  type SlackClient,
  type SlackOAuthResult,
  SlackRetryableError,
} from '../../application/ports/slack-client.port';

const AUTHORIZE_URL = 'https://slack.com/oauth/v2/authorize';
const API_URL = 'https://slack.com/api';
const BOT_SCOPES = ['chat:write'];
const REQUEST_TIMEOUT_MS = 15_000;
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
      scope: BOT_SCOPES.join(','),
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
    };
  }

  async postDirectMessage(
    botToken: string,
    slackUserId: string,
    text: string,
  ): Promise<void> {
    await this.call('chat.postMessage', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${botToken}`,
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify({ channel: slackUserId, text }),
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
      throw new SlackRetryableError(
        `Slack ${method} failed: ${response.status}`,
      );
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
