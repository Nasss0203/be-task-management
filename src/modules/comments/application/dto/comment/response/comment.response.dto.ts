import { Comment } from 'src/modules/comments/domain/aggregates/comment/comment.aggregate';
import { CommentTargetType } from 'src/modules/comments/domain/enums/comment-target-type.enum';

export interface CommentAuthorDto {
  id: string;
  username: string;
  email: string;
}

export class CommentResponseDto {
  id: string;
  page_id: string;
  target_type: CommentTargetType;
  target_id: string;
  parent_comment_id: string | null;
  body: string;
  author_id: string;
  /** null khi tài khoản tác giả không còn. */
  author: CommentAuthorDto | null;
  resolved_at: Date | null;
  edited_at: Date | null;
  created_at: Date;
  updated_at: Date;

  static fromDomain(
    comment: Comment,
    author: CommentAuthorDto | null,
  ): CommentResponseDto {
    const dto = new CommentResponseDto();

    dto.id = comment.getId();
    dto.page_id = comment.getPageId();
    dto.target_type = comment.getTargetType();
    dto.target_id = comment.getTargetId();
    dto.parent_comment_id = comment.getParentCommentId();
    dto.body = comment.getBody();
    dto.author_id = comment.getAuthorId();
    dto.author = author;
    dto.resolved_at = comment.getResolvedAt();
    dto.edited_at = comment.getEditedAt();
    dto.created_at = comment.getCreatedAt();
    dto.updated_at = comment.getUpdatedAt();

    return dto;
  }
}
