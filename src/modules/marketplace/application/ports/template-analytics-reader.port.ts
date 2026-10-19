/**
 * Calendar-day range in `timeZone`, both ends inclusive (YYYY-MM-DD).
 * `from: null` means all-time.
 */
export interface TemplateAnalyticsRange {
  from: string | null;
  to: string;
  timeZone: string;
}

export interface TemplateAnalyticsTotals {
  views: number;
  uniqueViewers: number;
  guestViews: number;
  uses: number;
  paidPurchases: number;
  grossRevenue: number;
  earnings: number;
}

export interface TemplateAnalyticsTemplateTotals {
  templateId: string;
  name: string;
  totals: TemplateAnalyticsTotals;
}

export interface TemplateAnalyticsDailyPoint {
  date: string;
  views: number;
  uses: number;
  paidPurchases: number;
  grossRevenue: number;
  earnings: number;
}

export interface TemplateAnalyticsVersionPoint {
  versionId: string;
  versionNumber: number;
  uses: number;
  paidPurchases: number;
  grossRevenue: number;
  earnings: number;
}

export interface TemplateAnalyticsSale {
  purchaseId: string;
  orderCode: string;
  paidAt: Date;
  versionNumber: number | null;
  amount: number;
  commissionRateBps: number;
  platformFeeAmount: number;
  earnings: number;
}

export interface TemplateAnalyticsOwner {
  createdBy: string;
  createdAt: Date;
}

export interface TemplateAnalyticsReader {
  findTemplateOwner(templateId: string): Promise<TemplateAnalyticsOwner | null>;

  listCreatorTotals(
    creatorId: string,
    range: TemplateAnalyticsRange,
  ): Promise<TemplateAnalyticsTemplateTotals[]>;

  getTemplateTotals(
    templateId: string,
    range: TemplateAnalyticsRange,
  ): Promise<TemplateAnalyticsTotals>;

  /** One zero-filled point per day; requires a bounded range. */
  getTemplateDaily(
    templateId: string,
    range: TemplateAnalyticsRange & { from: string },
  ): Promise<TemplateAnalyticsDailyPoint[]>;

  /** Same series summed over every template the creator owns. */
  getCreatorDaily(
    creatorId: string,
    range: TemplateAnalyticsRange & { from: string },
  ): Promise<TemplateAnalyticsDailyPoint[]>;

  /** Creation time of the creator's oldest template; starts an all-time chart. */
  findCreatorFirstTemplateAt(creatorId: string): Promise<Date | null>;

  /** Published versions plus any version with activity in the range. */
  getTemplateVersions(
    templateId: string,
    range: TemplateAnalyticsRange,
  ): Promise<TemplateAnalyticsVersionPoint[]>;

  getTemplateSales(
    templateId: string,
    range: TemplateAnalyticsRange,
    limit: number,
  ): Promise<TemplateAnalyticsSale[]>;
}
