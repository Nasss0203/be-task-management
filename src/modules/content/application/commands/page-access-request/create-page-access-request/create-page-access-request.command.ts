export class CreatePageAccessRequestCommand {
  constructor(
    public readonly userId: string,
    public readonly pageId: string,
    public readonly token: string,
  ) {}
}
