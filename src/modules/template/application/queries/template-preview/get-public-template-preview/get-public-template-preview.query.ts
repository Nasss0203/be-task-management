export class GetPublicTemplatePreviewQuery {
  constructor(
    public readonly templateId: string,
    public readonly versionId: string,
  ) {}
}
