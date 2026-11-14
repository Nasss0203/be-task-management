import { Inject, Injectable } from '@nestjs/common';

import { SlackStateTokenService } from 'src/shared/security/slack-state-token.service';

import { SLACK_INTEGRATION_TYPES } from '../../../slack-integration.types';
import type { SlackClient } from '../../ports/slack-client.port';
import { GetSlackAuthorizeUrlQuery } from './get-slack-authorize-url.query';

@Injectable()
export class GetSlackAuthorizeUrlHandler {
  constructor(
    @Inject(SLACK_INTEGRATION_TYPES.ports.SlackClient)
    private readonly client: SlackClient,

    private readonly stateTokenService: SlackStateTokenService,
  ) {}

  execute(query: GetSlackAuthorizeUrlQuery): { url: string } {
    const state = this.stateTokenService.generate({
      userId: query.userId,
      returnTo: query.returnTo,
    });

    return { url: this.client.buildAuthorizeUrl(state) };
  }
}
