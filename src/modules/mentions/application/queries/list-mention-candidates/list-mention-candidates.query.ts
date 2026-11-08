export class ListMentionCandidatesQuery {
  constructor(
    public readonly pageId: string,
    public readonly search: string,
    public readonly requesterId: string,
  ) {}
}
