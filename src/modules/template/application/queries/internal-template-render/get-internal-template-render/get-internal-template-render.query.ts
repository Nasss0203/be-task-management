export class GetInternalTemplateRenderQuery {
  constructor(
    public readonly templateId: string,
    public readonly versionId: string,
  ) {}
}
