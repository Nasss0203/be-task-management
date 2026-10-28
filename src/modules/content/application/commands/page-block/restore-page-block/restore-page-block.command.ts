export class RestorePageBlockCommand {
  constructor(
    public readonly blockId: string,
    // Who made the change, for the activity log; absent for system work.
    public readonly actorId?: string,
  ) {}
}
