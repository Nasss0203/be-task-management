export class GenerateTemplateVersionThumbnailCommand {
  constructor(
    public readonly templateId: string,
    public readonly versionId: string,
  ) {}
}
