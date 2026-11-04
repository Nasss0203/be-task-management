import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { COMMENT_TYPES } from 'src/modules/comments/comments.types';
import type { CommentRepository } from 'src/modules/comments/domain/repositories/comment.repository';
import { CommentNotificationService } from '../../../services/comment-notification.service';
import { DeleteCommentCommand } from './delete-comment.command';

@Injectable()
export class DeleteCommentHandler {
  constructor(
    @Inject(COMMENT_TYPES.repositories.CommentRepository)
    private readonly commentRepo: CommentRepository,
    private readonly commentNotifications: CommentNotificationService,
  ) {}

  /** Xóa mềm. Xóa comment gốc thì danh sách cũng ẩn luôn các trả lời của nó. */
  async execute(command: DeleteCommentCommand): Promise<void> {
    const comment = await this.commentRepo.findById(command.commentId);

    if (!comment || comment.isDeleted()) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.getAuthorId() !== command.userId) {
      throw new ForbiddenException('You can only delete your own comments');
    }

    comment.softDelete();

    await this.commentRepo.save(comment);

    // Xóa gốc thì các trả lời cũng ẩn theo, nên dọn cả thông báo của chúng
    const replyIds = comment.getParentCommentId()
      ? []
      : (
          await this.commentRepo.findByTarget(
            comment.getTargetType(),
            comment.getTargetId(),
          )
        )
          .filter((item) => item.getParentCommentId() === comment.getId())
          .map((item) => item.getId());

    await this.commentNotifications.afterDelete([comment.getId(), ...replyIds]);
  }
}
