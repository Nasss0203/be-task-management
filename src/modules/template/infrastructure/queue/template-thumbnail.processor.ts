import { Processor, WorkerHost } from '@nestjs/bullmq';
import type { Job } from 'bullmq';

import { GenerateTemplateVersionThumbnailCommand } from '../../application/commands/generate-template-version-thumbnail/generate-template-version-thumbnail.command';
import { GenerateTemplateVersionThumbnailHandler } from '../../application/commands/generate-template-version-thumbnail/generate-template-version-thumbnail.handler';
import { TEMPLATE_TYPES } from '../../template.types';

import { Inject } from '@nestjs/common';
import {
  GENERATE_TEMPLATE_THUMBNAIL_JOB,
  TEMPLATE_THUMBNAIL_QUEUE,
} from './template-thumbnail-queue.constants';

export type GenerateTemplateThumbnailJobData = {
  templateId: string;
  versionId: string;
};

@Processor(TEMPLATE_THUMBNAIL_QUEUE)
export class TemplateThumbnailProcessor extends WorkerHost {
  constructor(
    @Inject(TEMPLATE_TYPES.applications.GenerateTemplateVersionThumbnailHandler)
    private readonly generateTemplateVersionThumbnailHandler: GenerateTemplateVersionThumbnailHandler,
  ) {
    super();
  }

  async process(job: Job<GenerateTemplateThumbnailJobData>): Promise<void> {
    if (job.name !== GENERATE_TEMPLATE_THUMBNAIL_JOB) {
      return;
    }

    await this.generateTemplateVersionThumbnailHandler.execute(
      new GenerateTemplateVersionThumbnailCommand(
        job.data.templateId,
        job.data.versionId,
      ),
    );
  }
}
