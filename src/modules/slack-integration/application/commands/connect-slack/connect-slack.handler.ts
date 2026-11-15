import { Inject, Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';

import { SlackStateTokenService } from 'src/shared/security/slack-state-token.service';
import { TokenCipherService } from 'src/shared/security/token-cipher.service';

import type { SlackConnectionRepository } from '../../../domain/repositories/slack-connection.repository';
import { SLACK_INTEGRATION_TYPES } from '../../../slack-integration.types';
import type { SlackClient } from '../../ports/slack-client.port';
import { ConnectSlackCommand } from './connect-slack.command';

export type ConnectSlackResult = {
  returnTo: string;
  status: 'connected' | 'error';
};

@Injectable()
export class ConnectSlackHandler {
  private readonly logger = new Logger(ConnectSlackHandler.name);

  constructor(
    @Inject(SLACK_INTEGRATION_TYPES.ports.SlackClient)
    private readonly client: SlackClient,

    @Inject(SLACK_INTEGRATION_TYPES.repositories.SlackConnectionRepository)
    private readonly connectionRepository: SlackConnectionRepository,

    private readonly stateTokenService: SlackStateTokenService,

    private readonly tokenCipher: TokenCipherService,
  ) {}

  async execute(command: ConnectSlackCommand): Promise<ConnectSlackResult> {
    const state = this.stateTokenService.verify(command.state);

    if (!state) {
      return { returnTo: '/', status: 'error' };
    }

    if (command.error || !command.code) {
      return { returnTo: state.returnTo, status: 'error' };
    }

    try {
      const result = await this.client.exchangeCode(command.code);
      const existing = await this.connectionRepository.findByUserId(
        state.userId,
      );
      const sameSlackUser = await this.connectionRepository.findBySlackUser(
        result.teamId,
        result.slackUserId,
      );

      if (sameSlackUser && sameSlackUser.userId !== state.userId) {
        await this.connectionRepository.deleteByUserId(sameSlackUser.userId);
      }

      await this.connectionRepository.save({
        id: existing?.id ?? randomUUID(),
        userId: state.userId,
        slackTeamId: result.teamId,
        slackTeamName: result.teamName,
        slackUserId: result.slackUserId,
        botTokenEncrypted: this.tokenCipher.encrypt(result.botToken),
        lastError: null,
        lastDeliveredAt: null,
        lastDeliveryFailedAt: null,
        lastDeliveryError: null,
        grantedScopes: result.grantedScopes,
      });

      return { returnTo: state.returnTo, status: 'connected' };
    } catch (error) {
      this.logger.warn(`Slack connection failed: ${(error as Error).message}`);
      return { returnTo: state.returnTo, status: 'error' };
    }
  }
}
