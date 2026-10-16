export class ListTemplateVersionsQuery {
  constructor(
    public readonly templateId: string,
    public readonly userId: string,
  ) {}
}
