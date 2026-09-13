export class GetPageAccessQuery {
  constructor(
    public readonly userId: string,
    public readonly pageId: string,
  ) {}
}
