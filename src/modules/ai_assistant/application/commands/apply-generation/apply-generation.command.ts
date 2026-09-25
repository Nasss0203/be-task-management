export class ApplyGenerationCommand {
  constructor(
    public readonly userId: string,
    public readonly generationId: string,
  ) {}
}
