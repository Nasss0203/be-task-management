export class FailGenerationCommand {
  constructor(
    public readonly generationId: string,
    public readonly errorCode: string | null,
    public readonly errorMessage: string | null,
  ) {}
}
