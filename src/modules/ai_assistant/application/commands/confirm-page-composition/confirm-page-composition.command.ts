export class ConfirmPageCompositionCommand {
  constructor(
    public readonly userId: string,
    public readonly generationId: string,
    public readonly teamspaceId?: string | null,
    public readonly parentPageId?: string | null,
  ) {}
}
