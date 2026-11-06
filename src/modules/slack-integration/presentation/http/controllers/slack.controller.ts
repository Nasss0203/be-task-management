import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';

import { resolveFrontendOrigin } from 'src/common/config/frontend-origin.config';
import { Auth } from 'src/common/decorator/auth.decorator';
import { Public } from 'src/common/decorator/public.decorator';
import {
  PublicReadRateLimit,
  ReadRateLimit,
  WriteRateLimit,
} from 'src/common/decorator/rate-limit.decorator';
import type { IAuth } from 'src/types/auth';

import { ConnectSlackCommand } from '../../../application/commands/connect-slack/connect-slack.command';
import { ConnectSlackHandler } from '../../../application/commands/connect-slack/connect-slack.handler';
import { DisconnectSlackCommand } from '../../../application/commands/disconnect-slack/disconnect-slack.command';
import { DisconnectSlackHandler } from '../../../application/commands/disconnect-slack/disconnect-slack.handler';
import { GetSlackAuthorizeUrlHandler } from '../../../application/queries/get-slack-authorize-url/get-slack-authorize-url.handler';
import { GetSlackAuthorizeUrlQuery } from '../../../application/queries/get-slack-authorize-url/get-slack-authorize-url.query';
import { GetSlackStatusHandler } from '../../../application/queries/get-slack-status/get-slack-status.handler';
import { GetSlackStatusQuery } from '../../../application/queries/get-slack-status/get-slack-status.query';
import { SLACK_INTEGRATION_TYPES } from '../../../slack-integration.types';
import { GetSlackAuthorizeUrlRequest } from '../requests/get-slack-authorize-url.request';

const asOptionalString = (value: unknown) =>
  typeof value === 'string' && value ? value : null;

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
