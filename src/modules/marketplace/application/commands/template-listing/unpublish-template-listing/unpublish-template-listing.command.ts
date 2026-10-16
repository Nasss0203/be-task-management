export class UnpublishTemplateListingCommand {
  constructor(
    public readonly templateId: string,
    public readonly userId: string,
  ) {}
}
