export class GetPageAccessRequestsQuery {
  constructor(
    public readonly userId: string,
    public readonly pageId: string,
  ) {}
}
