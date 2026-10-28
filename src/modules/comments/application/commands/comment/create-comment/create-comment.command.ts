export class CreateCommentCommand {
  constructor(
    public readonly pageId: string,
    public readonly authorId: string,
    public readonly body: string,
    public readonly parentCommentId: string | null = null,
  ) {}
}
