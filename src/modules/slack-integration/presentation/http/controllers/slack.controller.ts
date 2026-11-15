import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';

import { resolveFrontendOrigin } from 'src/common/config/frontend-origin.config';
import { Auth } from 'src/common/decorator/auth.decorator';
import { Public } from 'src/common/decorator/public.decorator';
import {
  PublicReadRateLimit,
  ReadRateLimit,
  WebhookRateLimit,
  WriteRateLimit,
} from 'src/common/decorator/rate-limit.decorator';
import { SkipTransform } from 'src/common/decorator/skip.transform';
import type { IAuth } from 'src/types/auth';

import { ConnectSlackCommand } from '../../../application/commands/connect-slack/connect-slack.command';
import { ConnectSlackHandler } from '../../../application/commands/connect-slack/connect-slack.handler';
import { OpenSlackReplyCommand } from '../../../application/commands/open-slack-reply/open-slack-reply.command';
import { OpenSlackReplyHandler } from '../../../application/commands/open-slack-reply/open-slack-reply.handler';
import { ReplyFromSlackCommand } from '../../../application/commands/reply-from-slack/reply-from-slack.command';
import { ReplyFromSlackHandler } from '../../../application/commands/reply-from-slack/reply-from-slack.handler';
import { UnfurlSlackLinksCommand } from '../../../application/commands/unfurl-slack-links/unfurl-slack-links.command';
import { SLACK_REPLY_BLOCK_ID } from '../../../application/ports/slack-client.port';
import type { SlackUnfurlQueue } from '../../../application/ports/slack-unfurl-queue.port';
import { DisconnectSlackCommand } from '../../../application/commands/disconnect-slack/disconnect-slack.command';
import { DisconnectSlackHandler } from '../../../application/commands/disconnect-slack/disconnect-slack.handler';
import { GetSlackAuthorizeUrlHandler } from '../../../application/queries/get-slack-authorize-url/get-slack-authorize-url.handler';
import { GetSlackAuthorizeUrlQuery } from '../../../application/queries/get-slack-authorize-url/get-slack-authorize-url.query';
import { GetSlackStatusHandler } from '../../../application/queries/get-slack-status/get-slack-status.handler';
import { GetSlackStatusQuery } from '../../../application/queries/get-slack-status/get-slack-status.query';
import { SearchSlackPagesHandler } from '../../../application/queries/search-slack-pages/search-slack-pages.handler';
import { SearchSlackPagesQuery } from '../../../application/queries/search-slack-pages/search-slack-pages.query';
import { SLACK_INTEGRATION_TYPES } from '../../../slack-integration.types';
import { SlackRequestVerifier } from '../../../infrastructure/slack/slack-request-verifier';
import { GetSlackAuthorizeUrlRequest } from '../requests/get-slack-authorize-url.request';
import { parseSlackEvent } from '../requests/slack-event';
import { parseSlackInteraction } from '../requests/slack-interaction';

const asOptionalString = (value: unknown) =>
  typeof value === 'string' && value ? value : null;

const REPLY_POSTED_VIEW = {
  type: 'modal',
  title: { type: 'plain_text', text: 'Reply on page' },
  close: { type: 'plain_text', text: 'Done' },
  blocks: [
    {
      type: 'section',
      text: { type: 'mrkdwn', text: 'Your reply was posted on the page.' },
    },
  ],
};

@Controller('integrations/slack')
export class SlackController {
  constructor(
    private readonly configService: ConfigService,
    @Inject(SLACK_INTEGRATION_TYPES.applications.GetSlackAuthorizeUrlHandler)
    private readonly getAuthorizeUrlHandler: GetSlackAuthorizeUrlHandler,

    @Inject(SLACK_INTEGRATION_TYPES.applications.GetSlackStatusHandler)
    private readonly getStatusHandler: GetSlackStatusHandler,

    @Inject(SLACK_INTEGRATION_TYPES.applications.ConnectSlackHandler)
    private readonly connectHandler: ConnectSlackHandler,

    @Inject(SLACK_INTEGRATION_TYPES.applications.DisconnectSlackHandler)
    private readonly disconnectHandler: DisconnectSlackHandler,

    @Inject(SLACK_INTEGRATION_TYPES.applications.OpenSlackReplyHandler)
    private readonly openReplyHandler: OpenSlackReplyHandler,

    @Inject(SLACK_INTEGRATION_TYPES.applications.ReplyFromSlackHandler)
    private readonly replyHandler: ReplyFromSlackHandler,

    @Inject(SLACK_INTEGRATION_TYPES.applications.SearchSlackPagesHandler)
    private readonly searchPagesHandler: SearchSlackPagesHandler,

    @Inject(SLACK_INTEGRATION_TYPES.ports.SlackUnfurlQueue)
    private readonly unfurlQueue: SlackUnfurlQueue,

    private readonly requestVerifier: SlackRequestVerifier,
  ) {}

  @Post('authorize-url')
  @WriteRateLimit()
  @HttpCode(HttpStatus.OK)
  getAuthorizeUrl(
    @Body() request: GetSlackAuthorizeUrlRequest,
    @Auth() auth: IAuth,
  ) {
    return this.getAuthorizeUrlHandler.execute(
      new GetSlackAuthorizeUrlQuery(auth.id, request.returnTo),
    );
  }

  @Get('callback')
  @Public()
  @PublicReadRateLimit()
  async callback(
    @Query('code') code: unknown,
    @Query('state') state: unknown,
    @Query('error') error: unknown,
    @Res() response: Response,
  ): Promise<void> {
    const result = await this.connectHandler.execute(
      new ConnectSlackCommand(
        asOptionalString(code),
        asOptionalString(state),
        asOptionalString(error),
      ),
    );

    const origin = resolveFrontendOrigin(this.configService);
    const target = new URL(result.returnTo, origin);
    const url =
      target.origin === new URL(origin).origin ? target : new URL(origin);
    url.searchParams.set('slack', result.status);

    response.setHeader('Cache-Control', 'no-store');
    response.redirect(303, url.toString());
  }

  @Post('interactions')
  @Public()
  @SkipTransform()
  @WebhookRateLimit()
  @HttpCode(HttpStatus.OK)
  async interactions(
    @Body('payload') payload: unknown,
    @Req() request: RawBodyRequest<Request>,
    @Headers('x-slack-signature') signature?: string,
    @Headers('x-slack-request-timestamp') timestamp?: string,
  ) {
    if (!request.rawBody) {
      throw new BadRequestException('Slack request body is unavailable');
    }

    this.requestVerifier.verify({
      rawBody: request.rawBody,
      signature,
      timestamp,
    });

    const interaction = parseSlackInteraction(payload);

    if (interaction?.kind === 'open-reply') {
      await this.openReplyHandler.execute(
        new OpenSlackReplyCommand(
          interaction.slackTeamId,
          interaction.slackUserId,
          interaction.triggerId,
          interaction.commentId,
        ),
      );
      return;
    }

    if (interaction?.kind === 'submit-reply') {
      const result = await this.replyHandler.execute(
        new ReplyFromSlackCommand(
          interaction.slackTeamId,
          interaction.slackUserId,
          interaction.commentId,
          interaction.body,
        ),
      );

      return result.ok
        ? { response_action: 'update', view: REPLY_POSTED_VIEW }
        : {
            response_action: 'errors',
            errors: { [SLACK_REPLY_BLOCK_ID]: result.error },
          };
    }
  }

  @Post('commands')
  @Public()
  @SkipTransform()
  @WebhookRateLimit()
  @HttpCode(HttpStatus.OK)
  commands(
    @Body('team_id') slackTeamId: unknown,
    @Body('user_id') slackUserId: unknown,
    @Body('text') text: unknown,
    @Req() request: RawBodyRequest<Request>,
    @Headers('x-slack-signature') signature?: string,
    @Headers('x-slack-request-timestamp') timestamp?: string,
  ) {
    if (!request.rawBody) {
      throw new BadRequestException('Slack request body is unavailable');
    }

    this.requestVerifier.verify({
      rawBody: request.rawBody,
      signature,
      timestamp,
    });

    const teamId = asOptionalString(slackTeamId);
    const userId = asOptionalString(slackUserId);

    if (!teamId || !userId) {
      throw new BadRequestException('Slack command is missing the user');
    }

    return this.searchPagesHandler.execute(
      new SearchSlackPagesQuery(
        teamId,
        userId,
        typeof text === 'string' ? text : '',
      ),
    );
  }

  @Post('events')
  @Public()
  @SkipTransform()
  @WebhookRateLimit()
  @HttpCode(HttpStatus.OK)
  async events(
    @Body() body: unknown,
    @Req() request: RawBodyRequest<Request>,
    @Headers('x-slack-signature') signature?: string,
    @Headers('x-slack-request-timestamp') timestamp?: string,
  ) {
    if (!request.rawBody) {
      throw new BadRequestException('Slack request body is unavailable');
    }

    this.requestVerifier.verify({
      rawBody: request.rawBody,
      signature,
      timestamp,
    });

    const event = parseSlackEvent(body);

    if (event?.kind === 'url-verification') {
      return { challenge: event.challenge };
    }

    if (event?.kind === 'link-shared') {
      await this.unfurlQueue.enqueue(
        event.eventId,
        new UnfurlSlackLinksCommand(
          event.slackTeamId,
          event.slackUserId,
          event.target,
          event.urls,
        ),
      );
    }
  }

  @Get()
  @ReadRateLimit()
  getStatus(@Auth() auth: IAuth) {
    return this.getStatusHandler.execute(new GetSlackStatusQuery(auth.id));
  }

  @Delete()
  @WriteRateLimit()
  disconnect(@Auth() auth: IAuth) {
    return this.disconnectHandler.execute(new DisconnectSlackCommand(auth.id));
  }
}
