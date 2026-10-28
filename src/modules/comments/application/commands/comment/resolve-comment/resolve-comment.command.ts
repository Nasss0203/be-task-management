export class ResolveCommentCommand {
  constructor(
    public readonly commentId: string,
    public readonly userId: string,
    public readonly resolved: boolean,
  ) {}
}
