import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject } from '@nestjs/common';
import type { Job } from 'bullmq';

import type { NotificationCreatedEvent } from 'src/modules/notifications/application/services/notification-created.event';

import { DeliverSlackNotificationCommand } from '../../application/commands/deliver-slack-notification/deliver-slack-notification.command';
import { DeliverSlackNotificationHandler } from '../../application/commands/deliver-slack-notification/deliver-slack-notification.handler';
import { SLACK_INTEGRATION_TYPES } from '../../slack-integration.types';
import { SLACK_DELIVERY_QUEUE } from './slack-delivery-queue.constants';

@Processor(SLACK_DELIVERY_QUEUE)
export class SlackDeliveryProcessor extends WorkerHost {
  constructor(
    @Inject(
      SLACK_INTEGRATION_TYPES.applications.DeliverSlackNotificationHandler,
    )
    private readonly deliverHandler: DeliverSlackNotificationHandler,
  ) {
    super();
  }

  async process(job: Job<NotificationCreatedEvent>): Promise<void> {
    await this.deliverHandler.execute(
      new DeliverSlackNotificationCommand(job.data),
    );
  }
}
