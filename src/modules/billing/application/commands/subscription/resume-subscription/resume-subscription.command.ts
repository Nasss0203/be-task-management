export class ResumeSubscriptionCommand {
  constructor(
    public readonly workspaceId: string,
    public readonly userId: string,
  ) {}
}
