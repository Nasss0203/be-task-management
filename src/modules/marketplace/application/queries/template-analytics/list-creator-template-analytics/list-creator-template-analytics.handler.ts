import { Inject, Injectable } from '@nestjs/common';
import { MARKETPLACE_TYPES } from 'src/modules/marketplace/marketplace.types';

import type { CreatorTemplateAnalyticsListResponseDto } from '../../../dto/template-analytics/template-analytics.response.dto';
import type { TemplateAnalyticsReader } from '../../../ports/template-analytics-reader.port';
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

    return { ...range, currency: 'VND', items, daily };
  }
}
