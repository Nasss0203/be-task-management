import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { COMMENT_TYPES } from 'src/modules/comments/comments.types';
import type { CommentRepository } from 'src/modules/comments/domain/repositories/comment.repository';
import { CommentResponseDto } from '../../../dto/comment/response/comment.response.dto';
import { CommentAuthorService } from '../../../services/comment-author.service';
import { CommentNotificationService } from '../../../services/comment-notification.service';
import { UpdateCommentCommand } from './update-comment.command';

@Injectable()
export class UpdateCommentHandler {
  constructor(
    @Inject(COMMENT_TYPES.repositories.CommentRepository)
    private readonly commentRepo: CommentRepository,
    private readonly authors: CommentAuthorService,
    private readonly commentNotifications: CommentNotificationService,
  ) {}

  async execute(command: UpdateCommentCommand): Promise<CommentResponseDto> {
    const comment = await this.commentRepo.findById(command.commentId);

    if (!comment || comment.isDeleted()) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.getAuthorId() !== command.userId) {
      throw new ForbiddenException('You can only edit your own comments');
    }

    comment.edit(command.body);

    const saved = await this.commentRepo.save(comment);

    // Sửa comment: chỉ báo người mới được thêm vào mention, không báo "replied" lại
    await this.commentNotifications.afterSave(saved, command.userId);

    const authors = await this.authors.findAuthors([command.userId]);

    return CommentResponseDto.fromDomain(
      saved,
      authors.get(command.userId) ?? null,
    );
  }
}
