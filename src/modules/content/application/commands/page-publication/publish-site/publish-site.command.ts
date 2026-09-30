export class PublishSiteCommand {
  constructor(
    public readonly userId: string,
    public readonly pageId: string,
    public readonly subdomain: string,
    public readonly includeDescendants: boolean = false,
  ) {}
}
