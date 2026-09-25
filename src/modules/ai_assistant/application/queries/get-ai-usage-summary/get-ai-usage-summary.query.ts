export class GetAiUsageSummaryQuery {
  constructor(
    public readonly userId: string,
    public readonly filters: {
      workspaceId?: string;
      from?: Date;
      to?: Date;
    } = {},
  ) {}
}
