export class GetPageSharesQuery {
  constructor(
    public readonly userId: string,
    public readonly pageId: string,
  ) {}
}
