export class RemovePageShareCommand {
  constructor(
    public readonly userId: string,
    public readonly shareId: string,
  ) {}
}
