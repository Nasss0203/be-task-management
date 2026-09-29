export class PublishPageToSiteCommand {
  constructor(
    public readonly userId: string,
    public readonly siteId: string,
    public readonly pageId: string,
    public readonly path: string,
  ) {}
}
