export class SearchPageShareCandidatesQuery {
  constructor(
    public readonly userId: string,
    public readonly pageId: string,
    public readonly keyword: string,
  ) {}
}
