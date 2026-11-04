import { Comment } from '../../../../domain/aggregates/comment/comment.aggregate';
import { CommentOrmEntity } from '../entities/comment.orm-entity';

export class CommentMapper {
  static toDomain(orm: CommentOrmEntity): Comment {
    return Comment.restore({
      id: orm.id,
      workspaceId: orm.workspaceId,
      pageId: orm.pageId,
      targetType: orm.targetType,
      targetId: orm.targetId,
      parentCommentId: orm.parentCommentId,
      authorId: orm.authorId,
      body: orm.body,
      resolvedAt: orm.resolvedAt,
      resolvedBy: orm.resolvedBy,
      editedAt: orm.editedAt,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
      deletedAt: orm.deletedAt,
    });
  }

  static toOrm(comment: Comment): CommentOrmEntity {
    const orm = new CommentOrmEntity();

    orm.id = comment.getId();
    orm.workspaceId = comment.getWorkspaceId();
    orm.pageId = comment.getPageId();
    orm.targetType = comment.getTargetType();
    orm.targetId = comment.getTargetId();
    orm.parentCommentId = comment.getParentCommentId();
    orm.authorId = comment.getAuthorId();
    orm.body = comment.getBody();
    orm.resolvedAt = comment.getResolvedAt();
    orm.resolvedBy = comment.getResolvedBy();
    orm.editedAt = comment.getEditedAt();
    orm.createdAt = comment.getCreatedAt();
    orm.updatedAt = comment.getUpdatedAt();
    orm.deletedAt = comment.getDeletedAt();

    return orm;
  }
}
