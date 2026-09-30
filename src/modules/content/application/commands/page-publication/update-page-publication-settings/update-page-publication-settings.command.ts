export class UpdatePagePublicationSettingsCommand {
  constructor(
    public readonly actorId: string,
    public readonly pageId: string,
    public readonly siteId: string | undefined,
    public readonly includeDescendants: boolean,
  ) {}
}
