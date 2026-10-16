export class PublishTemplateListingCommand {
  constructor(
    public readonly templateId: string,
    public readonly userId: string,
  ) {}
}
