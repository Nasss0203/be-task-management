export class UpsertGoogleCalendarSyncCommand {
  constructor(
    public readonly databaseId: string,
    public readonly datePropertyId: string,
    public readonly userId: string,
    public readonly assignedToMeOnly?: boolean,
  ) {}
}
