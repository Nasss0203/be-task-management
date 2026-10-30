export class CreatePageBlockColumnsCommand {
  constructor(
    public readonly pageId: string,
    public readonly blockIds: string[],
    public readonly userId: string,
  ) {}
}
