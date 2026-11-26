export class RecordPageVisitCommand {
  constructor(
    public readonly userId: string,
    public readonly pageId: string,
  ) {}
}
