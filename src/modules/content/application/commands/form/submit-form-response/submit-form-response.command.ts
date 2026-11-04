export class SubmitFormResponseCommand {
  constructor(
    public readonly sectionBlockId: string,
    public readonly answers: Record<string, unknown>,
    public readonly userId: string,
  ) {}
}
