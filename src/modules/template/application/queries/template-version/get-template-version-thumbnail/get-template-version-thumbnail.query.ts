export class GetTemplateVersionThumbnailQuery {
  constructor(
    public readonly templateId: string,
    public readonly versionId: string,
    public readonly userId?: string,
  ) {}
}
