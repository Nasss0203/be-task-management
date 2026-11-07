import { ACTIVITY_TYPES } from 'src/modules/activity/activity.types';
import { type CreateActivityService } from 'src/modules/activity/application/ports/create-activity.service.port';
import {
  ActivityAction,
  ActivityEntityType,
} from 'src/modules/activity/domain/entities/activity.entity';
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { COMMENT_TYPES } from 'src/modules/comments/comments.types';
import type { CommentRepository } from 'src/modules/comments/domain/repositories/comment.repository';
import { CommentResponseDto } from '../../../dto/comment/response/comment.response.dto';
import { CommentAuthorService } from '../../../services/comment-author.service';
import { ResolveCommentCommand } from './resolve-comment.command';

@Injectable()
export class ResolveCommentHandler {
  constructor(
    @Inject(COMMENT_TYPES.repositories.CommentRepository)
    private readonly commentRepo: CommentRepository,
    private readonly authors: CommentAuthorService,
    @Inject(ACTIVITY_TYPES.services.CreateActivityService)
    private readonly createActivityService: CreateActivityService,
  ) {}

  /** Ai comment được trên page thì resolve / mở lại được thread (như Notion). */
  async execute(command: ResolveCommentCommand): Promise<CommentResponseDto> {
    const comment = await this.commentRepo.findById(command.commentId);

    if (!comment || comment.isDeleted()) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.isReply()) {
      throw new BadRequestException('Only a thread can be resolved');
    }

    const wasResolved = comment.getResolvedAt() !== null;
    comment.setResolved(command.resolved, command.userId);

    const saved = await this.commentRepo.save(comment);
    if (wasResolved !== (saved.getResolvedAt() !== null)) {
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
          kind: command.resolved ? 'RESOLVED' : 'REOPENED',
        },
      });
    }
    const authorId = saved.getAuthorId();
    const authors = await this.authors.findAuthors([authorId]);

    return CommentResponseDto.fromDomain(saved, authors.get(authorId) ?? null);
  }
}
