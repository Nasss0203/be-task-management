export class OpenSlackReplyCommand {
  constructor(
    public readonly slackTeamId: string,
    public readonly slackUserId: string,
    public readonly triggerId: string,
    public readonly commentId: string,
  ) {}
}
