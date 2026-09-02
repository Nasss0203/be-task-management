export class DeletePageBlockCommand {
  constructor(
    public readonly blockId: string,
    public readonly userId: string,
  ) {}
}
