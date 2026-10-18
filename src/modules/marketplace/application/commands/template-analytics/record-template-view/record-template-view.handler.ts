import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { MARKETPLACE_TYPES } from 'src/modules/marketplace/marketplace.types';
import type { TemplateContentPort } from 'src/modules/template/application/ports/template-content.port';
import { TEMPLATE_TYPES } from 'src/modules/template/template.types';

import { TemplateAnalyticsEvent } from '../../../../domain/entities/template-analytics-event.entity';
import { TemplateAnalyticsEventType } from '../../../../domain/enums/template-analytics-event-type.enum';
import type { TemplateAnalyticsEventRepository } from '../../../../domain/repositories/template-analytics-event.repository';
import { RecordTemplateViewCommand } from './record-template-view.command';

/**
 * Records a listing-level VIEW. Every call is stored (no dedupe); unique
 * viewers and creator self-views are filtered when analytics are read.
 */
@Injectable()
export class RecordTemplateViewHandler {
  constructor(
    @Inject(TEMPLATE_TYPES.ports.Content)
    private readonly templates: TemplateContentPort,

    @Inject(MARKETPLACE_TYPES.repositories.TemplateAnalyticsEventRepository)
    private readonly analyticsEvents: TemplateAnalyticsEventRepository,
  ) {}

  async execute(command: RecordTemplateViewCommand): Promise<void> {
    // Same gate as the public detail page: only PUBLIC, non-archived templates
    // with a published listing can be viewed, so only those are counted.
    const publicTemplate = await this.templates.findPublicById(
      command.templateId,
    );

    if (!publicTemplate) {
      throw new NotFoundException('Template not found');
    }

    await this.analyticsEvents.insertIfAbsent(
      TemplateAnalyticsEvent.create({
        templateId: publicTemplate.template.getId(),
        // Listing-level view: the viewer did not pick a version.
        versionId: null,
        eventType: TemplateAnalyticsEventType.VIEW,
        userId: command.userId,
      }),
    );
  }
}
