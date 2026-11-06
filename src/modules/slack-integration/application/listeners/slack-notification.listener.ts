import { Inject, Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

import {
  NOTIFICATION_CREATED_EVENT,
  type NotificationCreatedEvent,
} from 'src/modules/notifications/application/services/notification-created.event';

import type { SlackConnectionRepository } from '../../domain/repositories/slack-connection.repository';
import { SLACK_INTEGRATION_TYPES } from '../../slack-integration.types';
import type { SlackDeliveryQueue } from '../ports/slack-delivery-queue.port';

@Injectable()
export class SlackNotificationListener {
  private readonly logger = new Logger(SlackNotificationListener.name);

  constructor(
    @Inject(SLACK_INTEGRATION_TYPES.repositories.SlackConnectionRepository)
    private readonly connectionRepository: SlackConnectionRepository,

    @Inject(SLACK_INTEGRATION_TYPES.ports.SlackDeliveryQueue)
    private readonly deliveryQueue: SlackDeliveryQueue,
  ) {}

  @OnEvent(NOTIFICATION_CREATED_EVENT, { async: true })
  async handle(event: NotificationCreatedEvent): Promise<void> {
    try {
      const connection = await this.connectionRepository.findByUserId(
        event.recipientUserId,
      );

      if (!connection || connection.lastError) {
        return;
      }

      await this.deliveryQueue.enqueue(event);
    } catch (error) {
      this.logger.warn(
        `Slack delivery was not queued: ${(error as Error).message}`,
      );
    }
  }
}
