import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import type { Queue } from 'bullmq';

import type { UnfurlSlackLinksCommand } from '../../application/commands/unfurl-slack-links/unfurl-slack-links.command';
import type { SlackUnfurlQueue } from '../../application/ports/slack-unfurl-queue.port';
import {
  SLACK_UNFURL_QUEUE,
  UNFURL_SLACK_LINKS_JOB,
} from './slack-delivery-queue.constants';

@Injectable()
export class BullMqSlackUnfurlQueue implements SlackUnfurlQueue {
  constructor(
    @InjectQueue(SLACK_UNFURL_QUEUE)
    private readonly queue: Queue,
  ) {}

  async enqueue(
    eventId: string,
    command: UnfurlSlackLinksCommand,
  ): Promise<void> {
    await this.queue.add(
      UNFURL_SLACK_LINKS_JOB,
      { ...command },
      {
        jobId: `slack-unfurl-${eventId}`,
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: { age: 3600 },
        removeOnFail: 100,
      },
    );
  }
}
