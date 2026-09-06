export class CreatePageEditRequestCommand {
  constructor(
    public readonly userId: string,
    public readonly pageId: string,
  ) {}
}
