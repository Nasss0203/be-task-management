import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { COMMENT_TYPES } from 'src/modules/comments/comments.types';
import { Comment } from 'src/modules/comments/domain/aggregates/comment/comment.aggregate';
import type { CommentRepository } from 'src/modules/comments/domain/repositories/comment.repository';
import type { CommentTargetResolver } from '../../../ports/comment-target-resolver.port';
import { CommentResponseDto } from '../../../dto/comment/response/comment.response.dto';
import { CommentAuthorService } from '../../../services/comment-author.service';
import { CommentNotificationService } from '../../../services/comment-notification.service';
import { CreateCommentCommand } from './create-comment.command';

@Injectable()
export class CreateCommentHandler {
  constructor(
    @Inject(COMMENT_TYPES.repositories.CommentRepository)
    private readonly commentRepo: CommentRepository,
    @Inject(COMMENT_TYPES.ports.CommentTargetResolver)
    private readonly targets: CommentTargetResolver,
    private readonly authors: CommentAuthorService,
    private readonly commentNotifications: CommentNotificationService,
  ) {}

  async execute(command: CreateCommentCommand): Promise<CommentResponseDto> {
    const target = await this.targets.resolve(
      command.targetType,
      command.targetId,
    );

    if (!target) {
      throw new NotFoundException('Comment target not found');
    }

    let parent: Comment | null = null;

    if (command.parentCommentId) {
      parent = await this.commentRepo.findById(command.parentCommentId);

      if (
        !parent ||
        parent.isDeleted() ||
        parent.getTargetType() !== command.targetType ||
        parent.getTargetId() !== command.targetId
      ) {
        throw new NotFoundException('Parent comment not found');
      }

      if (parent.isReply()) {
        throw new BadRequestException('Replies can only be one level deep');
      }
    }

    const saved = await this.commentRepo.save(
      Comment.create({
        workspaceId: target.workspaceId,
        pageId: target.pageId,
        targetType: command.targetType,
        targetId: command.targetId,
        parentCommentId: command.parentCommentId,
        authorId: command.authorId,
        body: command.body,
      }),
    );

    await this.commentNotifications.afterSave(saved, command.authorId, parent);

    const authors = await this.authors.findAuthors([command.authorId]);

    return CommentResponseDto.fromDomain(
      saved,
      authors.get(command.authorId) ?? null,
    );
  }
}
