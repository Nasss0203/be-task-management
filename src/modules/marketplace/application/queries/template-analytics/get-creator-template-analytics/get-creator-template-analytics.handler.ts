import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { MARKETPLACE_TYPES } from 'src/modules/marketplace/marketplace.types';

import type { CreatorTemplateAnalyticsResponseDto } from '../../../dto/template-analytics/template-analytics.response.dto';
import type { TemplateAnalyticsReader } from '../../../ports/template-analytics-reader.port';
import {
  resolveAnalyticsRange,
  toAnalyticsDate,
} from '../../../services/template-analytics-range';
import { GetCreatorTemplateAnalyticsQuery } from './get-creator-template-analytics.query';

@Injectable()
export class GetCreatorTemplateAnalyticsHandler {
  constructor(
    @Inject(MARKETPLACE_TYPES.ports.AnalyticsReader)
    private readonly reader: TemplateAnalyticsReader,
  ) {}

  async execute(
    query: GetCreatorTemplateAnalyticsQuery,
  ): Promise<CreatorTemplateAnalyticsResponseDto> {
    const owner = await this.reader.findTemplateOwner(query.templateId);

    // 404 rather than 403 so other creators cannot probe which templates exist.
    if (!owner || owner.createdBy !== query.creatorId) {
      throw new NotFoundException('Template not found');
    }

    const range = resolveAnalyticsRange(query.from, query.to);
    // An all-time chart starts on the day the template was created.
    const dailyRange = {
      ...range,
      from: range.from ?? toAnalyticsDate(owner.createdAt),
    };

    const [totals, daily, versions] = await Promise.all([
      this.reader.getTemplateTotals(query.templateId, range),
      this.reader.getTemplateDaily(query.templateId, dailyRange),
      this.reader.getTemplateVersions(query.templateId, range),
    ]);

    return {
      ...range,
      currency: 'VND',
      templateId: query.templateId,
      totals,
      daily,
      versions,
    };
  }
}
