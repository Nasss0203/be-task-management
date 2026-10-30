export class SubmitFormResponseCommand {
  constructor(
    public readonly sectionBlockId: string,
    public readonly answers: Record<string, unknown>,
  ) {}
}
