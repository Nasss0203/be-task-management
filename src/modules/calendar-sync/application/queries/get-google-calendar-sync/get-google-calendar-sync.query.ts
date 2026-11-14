export class GetGoogleCalendarSyncQuery {
  constructor(
    public readonly databaseId: string,
    public readonly userId: string,
  ) {}
}
