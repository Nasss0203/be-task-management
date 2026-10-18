import { IsOptional, Matches } from 'class-validator';

/** Inclusive calendar dates in Vietnam time; omit both for all-time. */
export class TemplateAnalyticsRangeRequest {
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'from must be YYYY-MM-DD' })
  from?: string;

  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'to must be YYYY-MM-DD' })
  to?: string;
}
