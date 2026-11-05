export class RequestGoogleCalendarSyncCommand {
  constructor(
    public readonly databaseId: string,
    public readonly userId: string,
  ) {}
}
