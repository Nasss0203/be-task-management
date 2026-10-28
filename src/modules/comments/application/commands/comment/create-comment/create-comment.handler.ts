import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { COMMENT_TYPES } from 'src/modules/comments/comments.types';
import { Comment } from 'src/modules/comments/domain/aggregates/comment/comment.aggregate';
import { CommentTargetType } from 'src/modules/comments/domain/enums/comment-target-type.enum';
import type { CommentRepository } from 'src/modules/comments/domain/repositories/comment.repository';
import { CONTENT_TYPES } from 'src/modules/content/content.types';
import type { PageRepository } from 'src/modules/content/domain/repositories/page.repository';
import { CommentResponseDto } from '../../../dto/comment/response/comment.response.dto';
import { CommentAuthorService } from '../../../services/comment-author.service';
import { CreateCommentCommand } from './create-comment.command';

@Injectable()
export class CreateCommentHandler {
  constructor(
    @Inject(COMMENT_TYPES.repositories.CommentRepository)
    private readonly commentRepo: CommentRepository,
    @Inject(CONTENT_TYPES.repositories.PageRepository)
    private readonly pageRepo: PageRepository,
    private readonly authors: CommentAuthorService,
  ) {}

  async execute(command: CreateCommentCommand): Promise<CommentResponseDto> {
    const page = await this.pageRepo.findById(command.pageId);

    if (!page || page.getDeletedAt()) {
      throw new NotFoundException('Page not found');
    }

    if (command.parentCommentId) {
      const parent = await this.commentRepo.findById(command.parentCommentId);

      if (
        !parent ||
        parent.isDeleted() ||
        parent.getTargetType() !== CommentTargetType.PAGE ||
        parent.getTargetId() !== command.pageId
      ) {
        throw new NotFoundException('Parent comment not found');
      }

      if (parent.isReply()) {
        throw new BadRequestException('Replies can only be one level deep');
      }
    }

    const saved = await this.commentRepo.save(
      Comment.create({
        workspaceId: page.getWorkspaceId(),
        pageId: command.pageId,
        targetType: CommentTargetType.PAGE,
        targetId: command.pageId,
        parentCommentId: command.parentCommentId,
        authorId: command.authorId,
        body: command.body,
      }),
    );

    const authors = await this.authors.findAuthors([command.authorId]);

    return CommentResponseDto.fromDomain(
      saved,
      authors.get(command.authorId) ?? null,
    );
  }
}
