export class RestorePageTemplateCommand {
  constructor(
    public readonly templateId: string,
    public readonly userId: string,
  ) {}
}
