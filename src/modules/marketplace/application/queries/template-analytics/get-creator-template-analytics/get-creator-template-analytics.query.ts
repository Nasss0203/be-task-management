export class GetCreatorTemplateAnalyticsQuery {
  constructor(
    public readonly creatorId: string,
    public readonly templateId: string,
    /** Inclusive calendar dates (YYYY-MM-DD); both omitted means all-time. */
    public readonly from?: string,
    public readonly to?: string,
  ) {}
}
