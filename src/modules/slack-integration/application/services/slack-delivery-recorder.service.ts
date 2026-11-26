import { Inject, Injectable, Logger } from '@nestjs/common';

import type { NotificationCreatedEvent } from 'src/modules/notifications/application/services/notification-created.event';

import type {
  SlackDeliveryFailure,
  SlackDeliveryLog,
  SlackDeliveryStatus,
} from '../../domain/repositories/slack-delivery-log.repository';
import { SLACK_INTEGRATION_TYPES } from '../../slack-integration.types';

export const SLACK_DELIVERY_RETENTION_MS = 30 * 86_400_000;
export const SLACK_DELIVERY_TITLE_MAX_LENGTH = 200;

export type SlackDeliveryOutcome = {
  status: SlackDeliveryStatus;
  error: SlackDeliveryFailure | null;
  attempts: number;
};

@Injectable()
export class SlackDeliveryRecorder {
  private readonly logger = new Logger(SlackDeliveryRecorder.name);

  constructor(
    @Inject(SLACK_INTEGRATION_TYPES.repositories.SlackDeliveryLog)
    private readonly log: SlackDeliveryLog,
  ) {}

  async record(
    event: NotificationCreatedEvent,
    outcome: SlackDeliveryOutcome,
    now: Date = new Date(),
  ): Promise<void> {
    try {
      await this.log.record({
        userId: event.recipientUserId,
        notificationId: event.notification.id,
        notificationType: event.notification.type,
        title: event.notification.title.slice(
          0,
          SLACK_DELIVERY_TITLE_MAX_LENGTH,
        ),
        ...outcome,
        at: now,
      });
      await this.log.deleteOlderThan(
        event.recipientUserId,
        new Date(now.getTime() - SLACK_DELIVERY_RETENTION_MS),
      );
    } catch (error) {
      this.logger.warn(
        `Slack delivery log was not saved: ${(error as Error).message}`,
      );
    }
  }
}
