import { ACTIVITY_TYPES } from 'src/modules/activity/activity.types';
import { type CreateActivityService } from 'src/modules/activity/application/ports/create-activity.service.port';
import {
  ActivityAction,
  ActivityEntityType,
} from 'src/modules/activity/domain/entities/activity.entity';
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
    @Inject(ACTIVITY_TYPES.services.CreateActivityService)
    private readonly createActivityService: CreateActivityService,
  ) {}

  async execute(command: UpdateCommentCommand): Promise<CommentResponseDto> {
    const comment = await this.commentRepo.findById(command.commentId);

    if (!comment || comment.isDeleted()) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.getAuthorId() !== command.userId) {
      throw new ForbiddenException('You can only edit your own comments');
    }

    const previousBody = comment.getBody();
    comment.edit(command.body);

    const saved = await this.commentRepo.save(comment);
    if (previousBody !== saved.getBody()) {
      await this.createActivityService.create({
        workspaceId: saved.getWorkspaceId(),
        entityType: ActivityEntityType.COMMENT,
        entityId: saved.getId(),
        actorId: command.userId,
        action: ActivityAction.COMMENT_UPDATED,
        metadata: {
          pageId: saved.getPageId(),
          targetType: saved.getTargetType(),
          targetId: saved.getTargetId(),
        },
      });
    }

    // Sửa comment: chỉ báo người mới được thêm vào mention, không báo "replied" lại
    await this.commentNotifications.afterSave(saved, command.userId);

    const authors = await this.authors.findAuthors([command.userId]);

    return CommentResponseDto.fromDomain(
      saved,
      authors.get(command.userId) ?? null,
    );
  }
}
