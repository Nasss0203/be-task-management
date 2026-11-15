import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject } from '@nestjs/common';
import type { Job } from 'bullmq';

import { UnfurlSlackLinksCommand } from '../../application/commands/unfurl-slack-links/unfurl-slack-links.command';
import { UnfurlSlackLinksHandler } from '../../application/commands/unfurl-slack-links/unfurl-slack-links.handler';
import { SLACK_INTEGRATION_TYPES } from '../../slack-integration.types';
import { SLACK_UNFURL_QUEUE } from './slack-delivery-queue.constants';

@Processor(SLACK_UNFURL_QUEUE)
export class SlackUnfurlProcessor extends WorkerHost {
  constructor(
    @Inject(SLACK_INTEGRATION_TYPES.applications.UnfurlSlackLinksHandler)
    private readonly unfurlHandler: UnfurlSlackLinksHandler,
  ) {
    super();
  }

  async process(job: Job<UnfurlSlackLinksCommand>): Promise<void> {
    const { slackTeamId, slackUserId, target, urls } = job.data;
    await this.unfurlHandler.execute(
      new UnfurlSlackLinksCommand(slackTeamId, slackUserId, target, urls),
    );
  }
}
