export class GetPagePublicationQuery {
  constructor(
    public readonly pageId: string,
    public readonly siteId?: string,
  ) {}
}
