export class CreateTemplateVersionCommand {
  constructor(
    public readonly templateId: string,
    public readonly userId: string,
    public readonly sourcePageId?: string,
  ) {}
}
