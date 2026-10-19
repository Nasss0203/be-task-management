import { Inject, Injectable } from '@nestjs/common';
import { MARKETPLACE_TYPES } from 'src/modules/marketplace/marketplace.types';

import type { CreatorTemplateAnalyticsListResponseDto } from '../../../dto/template-analytics/template-analytics.response.dto';
import type { TemplateAnalyticsReader } from '../../../ports/template-analytics-reader.port';
import type { TemplateFeedbackReader } from '../../../ports/template-feedback-reader.port';
import {
  resolveAnalyticsRange,
  toAnalyticsDate,
} from '../../../services/template-analytics-range';
import { ListCreatorTemplateAnalyticsQuery } from './list-creator-template-analytics.query';

/** Totals for every template the caller created; the reader scopes by created_by. */
@Injectable()
export class ListCreatorTemplateAnalyticsHandler {
  constructor(
    @Inject(MARKETPLACE_TYPES.ports.AnalyticsReader)
    private readonly reader: TemplateAnalyticsReader,

    @Inject(MARKETPLACE_TYPES.ports.FeedbackReader)
    private readonly feedbackReader: TemplateFeedbackReader,
  ) {}

  async execute(
    query: ListCreatorTemplateAnalyticsQuery,
  ): Promise<CreatorTemplateAnalyticsListResponseDto> {
    const range = resolveAnalyticsRange(query.from, query.to);
    // An all-time chart starts on the day the creator's first template was made.
    const firstTemplateAt = range.from
      ? null
      : await this.reader.findCreatorFirstTemplateAt(query.creatorId);
    const dailyFrom =
      range.from ?? (firstTemplateAt && toAnalyticsDate(firstTemplateAt));

    const [items, daily] = await Promise.all([
      this.reader.listCreatorTotals(query.creatorId, range),
      dailyFrom
        ? this.reader.getCreatorDaily(query.creatorId, {
            ...range,
            from: dailyFrom,
          })
        : [],
    ]);

    const feedback = await this.feedbackReader.getSummaries(
      items.map((item) => item.templateId),
    );

    return {
      ...range,
      currency: 'VND',
      items: items.map((item) => ({
        ...item,
        feedback: feedback.get(item.templateId) ?? {
          ratingAverage: null,
          ratingCount: 0,
          likeCount: 0,
        },
      })),
      daily,
    };
  }
}
