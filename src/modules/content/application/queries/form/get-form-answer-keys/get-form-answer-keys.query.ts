export class GetFormAnswerKeysQuery {
  constructor(
    public readonly sectionBlockId: string,
    public readonly userId: string,
  ) {}
}
