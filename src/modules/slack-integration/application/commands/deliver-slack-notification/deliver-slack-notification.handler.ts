import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { resolveFrontendOrigin } from 'src/common/config/frontend-origin.config';
import { CONTENT_TYPES } from 'src/modules/content/content.types';
import type { PageRepository } from 'src/modules/content/domain/repositories/page.repository';
import {
  NotificationSourceType,
  NotificationType,
} from 'src/modules/notifications/domain/entities/notification.entity';
import type { WorkspaceRepository } from 'src/modules/workspace/domain/repositories/workspace.repository';
import { WORKSPACE_TYPES } from 'src/modules/workspace/workspace.types';
import { TokenCipherService } from 'src/shared/security/token-cipher.service';

import {
  SlackConnectionError,
  type SlackConnectionRepository,
} from '../../../domain/repositories/slack-connection.repository';
import { SlackDeliveryStatus } from '../../../domain/repositories/slack-delivery-log.repository';
import { SLACK_INTEGRATION_TYPES } from '../../../slack-integration.types';
import {
  SlackAuthError,
  type SlackClient,
} from '../../ports/slack-client.port';
import { SlackDeliveryRecorder } from '../../services/slack-delivery-recorder.service';
import { DeliverSlackNotificationCommand } from './deliver-slack-notification.command';

type SlackNotification =
  DeliverSlackNotificationCommand['event']['notification'];

const escapeSlackText = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const REPLYABLE_TYPES: ReadonlySet<string> = new Set([
  NotificationType.COMMENT_MENTIONED,
  NotificationType.COMMENT_REPLIED,
]);

const replyCommentIdOf = (notification: SlackNotification): string | null =>
  REPLYABLE_TYPES.has(notification.type) &&
  notification.sourceType === NotificationSourceType.COMMENT
    ? notification.sourceId
    : null;

const pageIdOf = (notification: SlackNotification): string | null => {
  if (notification.sourceType === NotificationSourceType.PAGE) {
    return notification.sourceId;
  }
  const pageId = notification.metadata?.pageId;
  return typeof pageId === 'string' ? pageId : null;
};

@Injectable()
export class DeliverSlackNotificationHandler {
  private readonly logger = new Logger(DeliverSlackNotificationHandler.name);

  constructor(
    @Inject(SLACK_INTEGRATION_TYPES.repositories.SlackConnectionRepository)
    private readonly connectionRepository: SlackConnectionRepository,

    @Inject(SLACK_INTEGRATION_TYPES.ports.SlackClient)
    private readonly client: SlackClient,

    private readonly tokenCipher: TokenCipherService,

    private readonly configService: ConfigService,

    @Inject(WORKSPACE_TYPES.repositories.WorkspaceRepository)
    private readonly workspaces: WorkspaceRepository,

    @Inject(CONTENT_TYPES.repositories.PageRepository)
    private readonly pages: PageRepository,

    private readonly deliveries: SlackDeliveryRecorder,
  ) {}

  async execute(command: DeliverSlackNotificationCommand): Promise<void> {
    const { recipientUserId, notification } = command.event;
    const connection =
      await this.connectionRepository.findByUserId(recipientUserId);

    if (!connection || connection.lastError) {
      return;
    }

    const location = await this.locationOf(notification);

    try {
      await this.client.postDirectMessage(
        this.tokenCipher.decrypt(connection.botTokenEncrypted),
        connection.slackUserId,
        this.toText(notification, location),
        replyCommentIdOf(notification),
      );
    } catch (error) {
      if (error instanceof SlackAuthError) {
        await this.connectionRepository.markError(
          connection.id,
          SlackConnectionError.ACCESS_REVOKED,
        );
        return this.deliveries.record(command.event, {
          status: SlackDeliveryStatus.FAILED,
          error: SlackConnectionError.ACCESS_REVOKED,
          attempts: command.attempt,
        });
      }
      throw error;
    }

    try {
      await this.connectionRepository.markDelivered(connection.id, new Date());
    } catch (error) {
      this.logger.warn(
        `Slack delivery status was not saved: ${(error as Error).message}`,
      );
    }

    await this.deliveries.record(command.event, {
      status: SlackDeliveryStatus.SENT,
      error: null,
      attempts: command.attempt,
    });
  }

  private async locationOf(
    notification: SlackNotification,
  ): Promise<string | null> {
    if (notification.type === NotificationType.PAGE_ACCESS_REJECTED) {
      return null;
    }

    const pageId = pageIdOf(notification);
    const [workspace, page] = await Promise.all([
      notification.workspaceId
        ? this.workspaces.findById(notification.workspaceId)
        : null,
      pageId ? this.pages.findById(pageId) : null,
    ]);

    const parts = [
      workspace?.getName(),
      page && (page.getTitle() || 'Untitled'),
    ].filter(Boolean);

    return parts.length ? parts.join(' › ') : null;
  }

  private toText(notification: SlackNotification, location: string | null) {
    const url = notification.actionUrl
      ? new URL(
          notification.actionUrl,
          resolveFrontendOrigin(this.configService),
        ).toString()
      : null;

    return [
      `*${escapeSlackText(notification.title)}*`,
      location && escapeSlackText(location),
      notification.message && escapeSlackText(notification.message),
      url && `<${url}|Open in Taskmanly>`,
    ]
      .filter(Boolean)
      .join('\n');
  }
}
