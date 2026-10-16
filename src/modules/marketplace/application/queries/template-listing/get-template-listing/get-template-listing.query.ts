export class GetTemplateListingQuery {
  constructor(
    public readonly templateId: string,
    public readonly userId: string,
  ) {}
}
