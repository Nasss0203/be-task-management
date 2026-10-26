export class CreatePageAccessRequestCommand {
  constructor(
    public readonly userId: string,
    public readonly pageId: string,
    public readonly token?: string,
    public readonly site?: { subdomain: string; path: string },
  ) {}
}
