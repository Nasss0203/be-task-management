export class CreatePageShareLinkCommand {
  constructor(
    public readonly userId: string,
    public readonly pageId: string,
    public readonly expiresAt?: Date | null,
  ) {}
}
