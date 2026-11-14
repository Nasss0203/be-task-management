export class DeleteGoogleCalendarSyncCommand {
  constructor(
    public readonly databaseId: string,
    public readonly userId: string,
  ) {}
}
