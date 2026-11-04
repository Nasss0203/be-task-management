import { PersistenceContext } from 'src/shared/domain/persistence-context';
import { Comment } from '../aggregates/comment/comment.aggregate';
import { CommentTargetType } from '../enums/comment-target-type.enum';

export interface CommentRepository {
  save(comment: Comment, context?: PersistenceContext): Promise<Comment>;

  findById(id: string, context?: PersistenceContext): Promise<Comment | null>;

  findByTarget(
    targetType: CommentTargetType,
    targetId: string,
    context?: PersistenceContext,
  ): Promise<Comment[]>;

  /** Số comment đang hiện của từng target cùng loại trong một page (vd mọi block của page). */
  countVisibleByPage(
    pageId: string,
    targetType: CommentTargetType,
    context?: PersistenceContext,
  ): Promise<Record<string, number>>;
}
