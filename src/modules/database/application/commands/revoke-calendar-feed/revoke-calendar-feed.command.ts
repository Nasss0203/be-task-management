export class RevokeCalendarFeedCommand {
  constructor(
    public readonly databaseId: string,
    public readonly userId: string,
  ) {}
}
