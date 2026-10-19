import type {
  TemplateAnalyticsDailyPoint,
  TemplateAnalyticsSale,
  TemplateAnalyticsTemplateTotals,
  TemplateAnalyticsTotals,
  TemplateAnalyticsVersionPoint,
} from '../../ports/template-analytics-reader.port';
import type { TemplateFeedbackSummary } from '../../ports/template-feedback-reader.port';

interface TemplateAnalyticsRangeDto {
  /** Null means all-time. */
  from: string | null;
  to: string;
  timeZone: string;
  currency: 'VND';
}

export interface CreatorTemplateAnalyticsListResponseDto extends TemplateAnalyticsRangeDto {
  items: (TemplateAnalyticsTemplateTotals & {
    feedback: TemplateFeedbackSummary;
  })[];
  /** Summed over all templates; empty when the creator has none. */
  daily: TemplateAnalyticsDailyPoint[];
}

export interface CreatorTemplateAnalyticsResponseDto extends TemplateAnalyticsRangeDto {
  templateId: string;
  totals: TemplateAnalyticsTotals;
  daily: TemplateAnalyticsDailyPoint[];
  versions: TemplateAnalyticsVersionPoint[];
  sales: TemplateAnalyticsSale[];
}
