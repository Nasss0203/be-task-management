export class GetTemplateVersionBlocksQuery {
  constructor(
    public readonly versionId: string,
    public readonly userId?: string,
  ) {}
}
