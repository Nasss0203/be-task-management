export class CreateTemplateListingCommand {
  constructor(
    public readonly templateId: string,
    public readonly userId: string,
  ) {}
}
