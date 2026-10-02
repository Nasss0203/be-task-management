export class GetTemplateVersionQuery {
  constructor(
    public readonly versionId: string,
    public readonly userId?: string,
  ) {}
}
