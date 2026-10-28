import { CommentTargetType } from 'src/modules/comments/domain/enums/comment-target-type.enum';

export class CreateCommentCommand {
  constructor(
    public readonly targetType: CommentTargetType,
    public readonly targetId: string,
    public readonly authorId: string,
    public readonly body: string,
    public readonly parentCommentId: string | null = null,
  ) {}
}
