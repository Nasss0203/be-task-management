export class SetFormAnswerKeyCommand {
  constructor(
    public readonly sectionBlockId: string,
    public readonly fieldBlockId: string,
    public readonly correctValue: unknown,
    public readonly points: number,
    public readonly userId: string,
  ) {}
}
