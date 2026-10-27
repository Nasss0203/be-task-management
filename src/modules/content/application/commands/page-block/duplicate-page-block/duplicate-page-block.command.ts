export class DuplicatePageBlockCommand {
  constructor(
    public readonly blockId: string,
    public readonly userId: string,
  ) {}
}
