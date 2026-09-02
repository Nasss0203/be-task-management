export class CreatePageCommand {
  constructor(
    public readonly userId: string,
    public readonly workspaceId: string,
    public readonly title: string,
    public readonly teamspaceId?: string | null,
    public readonly parentPageId?: string | null,
    public readonly icon?: string | null,
    public readonly coverUrl?: string | null,
  ) {}
}
