import { CommentTargetType } from '../../domain/enums/comment-target-type.enum';

/** Page chứa thứ được comment; quyền và workspace của comment lấy theo page này. */
export interface CommentTargetLocation {
  pageId: string;
  workspaceId: string;
}

export interface CommentTargetResolver {
  /** null khi target không tồn tại, đã xóa, hoặc page chứa nó đã vào thùng rác. */
  resolve(
    targetType: CommentTargetType,
    targetId: string,
  ): Promise<CommentTargetLocation | null>;
}
