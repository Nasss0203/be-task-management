export class ReplyFromSlackCommand {
  constructor(
    public readonly slackTeamId: string,
    public readonly slackUserId: string,
    public readonly viewId: string,
    public readonly commentId: string,
    public readonly body: string,
  ) {}
}
