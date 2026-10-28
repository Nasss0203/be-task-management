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
}
