export class GetMyCalendarFeedQuery {
  constructor(
    public readonly databaseId: string,
    public readonly userId: string,
  ) {}
}
