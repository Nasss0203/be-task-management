import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import type { Queue } from 'bullmq';

import type {
  GenerateTemplateThumbnailJobInput,
  TemplateThumbnailJobQueue,
} from '../../application/ports/template-thumbnail-job-queue.port';
import {
  GENERATE_TEMPLATE_THUMBNAIL_JOB,
  TEMPLATE_THUMBNAIL_QUEUE,
} from './template-thumbnail-queue.constants';

@Injectable()
export class BullMqTemplateThumbnailJobQueue implements TemplateThumbnailJobQueue {
  constructor(
    @InjectQueue(TEMPLATE_THUMBNAIL_QUEUE)
    private readonly queue: Queue,
  ) {}

  async enqueueGenerateThumbnail(
    input: GenerateTemplateThumbnailJobInput,
  ): Promise<void> {
    await this.queue.add(
      GENERATE_TEMPLATE_THUMBNAIL_JOB,
      {
        templateId: input.templateId,
        versionId: input.versionId,
      },
      {
        jobId: `template-thumbnail-${input.versionId}`,

        attempts: 3,

        backoff: {
          type: 'exponential',
          delay: 3000,
        },

        removeOnComplete: {
          count: 100,
        },

        removeOnFail: {
          count: 100,
        },
      },
    );
  }
}
