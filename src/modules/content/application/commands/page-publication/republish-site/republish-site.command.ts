export class RepublishSiteCommand {
  constructor(
    public readonly userId: string,
    public readonly pageId: string,
    public readonly siteId?: string,
  ) {}
}
