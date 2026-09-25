export class DiscardGenerationCommand {
  constructor(
    public readonly userId: string,
    public readonly generationId: string,
  ) {}
}
