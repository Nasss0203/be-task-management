export class ListCreatorTemplateAnalyticsQuery {
  constructor(
    public readonly creatorId: string,
    /** Inclusive calendar dates (YYYY-MM-DD); both omitted means all-time. */
    public readonly from?: string,
    public readonly to?: string,
  ) {}
}
