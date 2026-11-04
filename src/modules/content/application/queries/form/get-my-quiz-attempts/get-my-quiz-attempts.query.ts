export class GetMyQuizAttemptsQuery {
  constructor(
    public readonly sectionBlockId: string,
    public readonly userId: string,
  ) {}
}
