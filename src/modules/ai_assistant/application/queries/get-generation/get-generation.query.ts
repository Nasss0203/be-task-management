export class GetGenerationQuery {
  constructor(
    public readonly userId: string,
    public readonly generationId: string,
  ) {}
}
