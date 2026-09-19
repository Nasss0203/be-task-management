export class FindPageByIdQuery {
  constructor(
    public readonly userId: string,
    public readonly pageId: string,
    public readonly shareToken?: string,
  ) {}
}
