import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject, Logger } from '@nestjs/common';
import { DelayedError, type Job } from 'bullmq';

import type { NotificationCreatedEvent } from 'src/modules/notifications/application/services/notification-created.event';

import { DeliverSlackNotificationCommand } from '../../application/commands/deliver-slack-notification/deliver-slack-notification.command';
import { DeliverSlackNotificationHandler } from '../../application/commands/deliver-slack-notification/deliver-slack-notification.handler';
import { SlackRateLimitedError } from '../../application/ports/slack-client.port';
import {
  SlackDeliveryError,
  type SlackConnectionRepository,
} from '../../domain/repositories/slack-connection.repository';
import { SLACK_INTEGRATION_TYPES } from '../../slack-integration.types';
import { SLACK_DELIVERY_QUEUE } from './slack-delivery-queue.constants';

export const MAX_RATE_LIMITED_DELAYS = 5;

type SlackDeliveryJob = Job<
  NotificationCreatedEvent & { rateLimitedDelays?: number }
>;

@Processor(SLACK_DELIVERY_QUEUE)
export class SlackDeliveryProcessor extends WorkerHost {
  private readonly logger = new Logger(SlackDeliveryProcessor.name);

  constructor(
    @Inject(
      SLACK_INTEGRATION_TYPES.applications.DeliverSlackNotificationHandler,
    )
    private readonly deliverHandler: DeliverSlackNotificationHandler,

    @Inject(SLACK_INTEGRATION_TYPES.repositories.SlackConnectionRepository)
    private readonly connectionRepository: SlackConnectionRepository,
  ) {
    super();
  }

  async process(job: SlackDeliveryJob, token?: string): Promise<void> {
    try {
      await this.deliverHandler.execute(
        new DeliverSlackNotificationCommand(job.data),
      );
    } catch (error) {
      const delays = job.data.rateLimitedDelays ?? 0;

      if (
        !(error instanceof SlackRateLimitedError) ||
        delays >= MAX_RATE_LIMITED_DELAYS
      ) {
        throw error;
      }

      await job.updateData({ ...job.data, rateLimitedDelays: delays + 1 });
      await job.moveToDelayed(Date.now() + error.retryAfterMs, token);
      throw new DelayedError();
    }
  }

  @OnWorkerEvent('failed')
  async onFailed(job: SlackDeliveryJob | undefined, error: Error) {
    if (!job || job.attemptsMade < (job.opts.attempts ?? 1)) {
      return;
    }

    try {
      const connection = await this.connectionRepository.findByUserId(
        job.data.recipientUserId,
      );

      if (connection) {
        await this.connectionRepository.markDeliveryFailed(
          connection.id,
          new Date(),
          error instanceof SlackRateLimitedError
            ? SlackDeliveryError.RATE_LIMITED
            : SlackDeliveryError.DELIVERY_FAILED,
        );
      }
    } catch (statusError) {
      this.logger.warn(
        `Slack delivery failure was not saved: ${(statusError as Error).message}`,
      );
    }
  }
}
