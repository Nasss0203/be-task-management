export class GetUsableTemplateVersionsQuery {
  constructor(
    public readonly templateId: string,
    public readonly userId: string,
  ) {}
}
