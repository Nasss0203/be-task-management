export class PublishTemplateVersionCommand {
  constructor(
    public readonly templateId: string,
    public readonly versionId: string,
    public readonly userId: string,
  ) {}
}
