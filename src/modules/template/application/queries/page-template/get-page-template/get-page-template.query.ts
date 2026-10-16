export class GetPageTemplateQuery {
  constructor(
    public readonly templateId: string,
    public readonly userId?: string,
  ) {}
}
