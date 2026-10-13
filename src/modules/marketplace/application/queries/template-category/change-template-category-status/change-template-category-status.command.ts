export class ChangeTemplateCategoryStatusCommand {
  constructor(
    public readonly categoryId: string,
    public readonly isActive: boolean,
  ) {}
}
