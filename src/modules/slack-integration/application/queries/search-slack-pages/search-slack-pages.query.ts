export class SearchSlackPagesQuery {
  constructor(
    public readonly slackTeamId: string,
    public readonly slackUserId: string,
    public readonly text: string,
  ) {}
}
