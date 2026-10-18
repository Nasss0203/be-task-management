import { Inject, Injectable } from '@nestjs/common';
import { MARKETPLACE_TYPES } from 'src/modules/marketplace/marketplace.types';

import type { CreatorTemplateAnalyticsListResponseDto } from '../../../dto/template-analytics/template-analytics.response.dto';
import type { TemplateAnalyticsReader } from '../../../ports/template-analytics-reader.port';
import { resolveAnalyticsRange } from '../../../services/template-analytics-range';
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
    const items = await this.reader.listCreatorTotals(query.creatorId, range);

    return { ...range, currency: 'VND', items };
  }
}
