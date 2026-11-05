export class UpsertCalendarFeedCommand {
  constructor(
    public readonly databaseId: string,
    public readonly datePropertyId: string,
    public readonly userId: string,
  ) {}
}
