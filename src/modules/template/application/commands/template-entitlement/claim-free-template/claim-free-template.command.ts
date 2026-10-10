export class ClaimFreeTemplateCommand {
  constructor(
    public readonly templateId: string,
    public readonly userId: string,
  ) {}
}
