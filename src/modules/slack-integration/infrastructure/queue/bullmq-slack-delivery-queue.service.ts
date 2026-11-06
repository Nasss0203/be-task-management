import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import type { Queue } from 'bullmq';

import type { NotificationCreatedEvent } from 'src/modules/notifications/application/services/notification-created.event';

import type { SlackDeliveryQueue } from '../../application/ports/slack-delivery-queue.port';
import {
  DELIVER_SLACK_NOTIFICATION_JOB,
  SLACK_DELIVERY_QUEUE,
} from './slack-delivery-queue.constants';

@Injectable()
export class BullMqSlackDeliveryQueue implements SlackDeliveryQueue {
  constructor(
    @InjectQueue(SLACK_DELIVERY_QUEUE)
    private readonly queue: Queue,
  ) {}

  async enqueue(event: NotificationCreatedEvent): Promise<void> {
    await this.queue.add(DELIVER_SLACK_NOTIFICATION_JOB, event, {
      jobId: `slack-${event.notification.id}`,
      attempts: 5,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: true,
      removeOnFail: 100,
    });
  }
}
