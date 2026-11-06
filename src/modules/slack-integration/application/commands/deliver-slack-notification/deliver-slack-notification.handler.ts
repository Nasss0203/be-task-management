import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { resolveFrontendOrigin } from 'src/common/config/frontend-origin.config';
import { TokenCipherService } from 'src/shared/security/token-cipher.service';

import {
  SlackConnectionError,
  type SlackConnectionRepository,
} from '../../../domain/repositories/slack-connection.repository';
import { SLACK_INTEGRATION_TYPES } from '../../../slack-integration.types';
import {
  SlackAuthError,
  type SlackClient,
} from '../../ports/slack-client.port';
import { DeliverSlackNotificationCommand } from './deliver-slack-notification.command';

const escapeSlackText = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

@Injectable()
export class DeliverSlackNotificationHandler {
  constructor(
    @Inject(SLACK_INTEGRATION_TYPES.repositories.SlackConnectionRepository)
    private readonly connectionRepository: SlackConnectionRepository,

    @Inject(SLACK_INTEGRATION_TYPES.ports.SlackClient)
    private readonly client: SlackClient,

    private readonly tokenCipher: TokenCipherService,

    private readonly configService: ConfigService,
  ) {}

  async execute(command: DeliverSlackNotificationCommand): Promise<void> {
    const { recipientUserId, notification } = command.event;
    const connection =
      await this.connectionRepository.findByUserId(recipientUserId);

    if (!connection || connection.lastError) {
      return;
    }

    try {
      await this.client.postDirectMessage(
        this.tokenCipher.decrypt(connection.botTokenEncrypted),
        connection.slackUserId,
        this.toText(notification),
      );
    } catch (error) {
      if (error instanceof SlackAuthError) {
        return this.connectionRepository.markError(
          connection.id,
          SlackConnectionError.ACCESS_REVOKED,
        );
      }
      throw error;
    }
  }

  private toText(
    notification: DeliverSlackNotificationCommand['event']['notification'],
  ) {
    const url = notification.actionUrl
      ? new URL(
          notification.actionUrl,
          resolveFrontendOrigin(this.configService),
        ).toString()
      : null;

    return [
      `*${escapeSlackText(notification.title)}*`,
      notification.message && escapeSlackText(notification.message),
      url && `<${url}|Open in Taskmanly>`,
    ]
      .filter(Boolean)
      .join('\n');
  }
}
