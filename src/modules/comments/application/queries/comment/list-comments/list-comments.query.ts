import { CommentTargetType } from 'src/modules/comments/domain/enums/comment-target-type.enum';

export class ListCommentsQuery {
  constructor(
    public readonly targetType: CommentTargetType,
    public readonly targetId: string,
  ) {}
}
