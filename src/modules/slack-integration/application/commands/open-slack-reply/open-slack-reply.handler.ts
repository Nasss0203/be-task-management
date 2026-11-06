import { Inject, Injectable } from '@nestjs/common';

import { TokenCipherService } from 'src/shared/security/token-cipher.service';

import type { SlackConnectionRepository } from '../../../domain/repositories/slack-connection.repository';
import { SLACK_INTEGRATION_TYPES } from '../../../slack-integration.types';
import type { SlackClient } from '../../ports/slack-client.port';
import { OpenSlackReplyCommand } from './open-slack-reply.command';

@Injectable()
export class OpenSlackReplyHandler {
  constructor(
    @Inject(SLACK_INTEGRATION_TYPES.repositories.SlackConnectionRepository)
    private readonly connectionRepository: SlackConnectionRepository,

    @Inject(SLACK_INTEGRATION_TYPES.ports.SlackClient)
    private readonly client: SlackClient,

    private readonly tokenCipher: TokenCipherService,
  ) {}

  async execute(command: OpenSlackReplyCommand): Promise<void> {
    const connection = await this.connectionRepository.findBySlackUser(
      command.slackTeamId,
      command.slackUserId,
    );

    if (!connection || connection.lastError) {
      return;
    }

    await this.client.openReplyModal(
      this.tokenCipher.decrypt(connection.botTokenEncrypted),
      command.triggerId,
      command.commentId,
    );
  }
}
