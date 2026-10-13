export class CreateTemplateCategoryCommand {
  constructor(
    public readonly name: string,
    public readonly slug?: string,
    public readonly description?: string | null,
    public readonly sortOrder?: number,
  ) {}
}
