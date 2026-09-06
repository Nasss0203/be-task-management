export class GetPageEditRequestsQuery {
  constructor(
    public readonly userId: string,
    public readonly pageId: string,
  ) {}
}
