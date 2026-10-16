export class UseTemplateCommand {
  constructor(
    public readonly templateId: string,
    public readonly versionId: string,
    public readonly workspaceId: string,
    public readonly userId: string,
  ) {}
}
