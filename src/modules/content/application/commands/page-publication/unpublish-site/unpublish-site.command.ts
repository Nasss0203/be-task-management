export class UnpublishSiteCommand {
  constructor(
    public readonly userId: string,
    public readonly pageId: string,
    public readonly siteId?: string,
  ) {}
}
