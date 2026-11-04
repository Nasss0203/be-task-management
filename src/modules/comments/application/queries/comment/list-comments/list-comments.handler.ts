import { Inject, Injectable } from '@nestjs/common';
import { COMMENT_TYPES } from 'src/modules/comments/comments.types';
import type { CommentRepository } from 'src/modules/comments/domain/repositories/comment.repository';
import { CommentResponseDto } from '../../../dto/comment/response/comment.response.dto';
import { CommentAuthorService } from '../../../services/comment-author.service';
import { ListCommentsQuery } from './list-comments.query';

@Injectable()
export class ListCommentsHandler {
  constructor(
    @Inject(COMMENT_TYPES.repositories.CommentRepository)
    private readonly commentRepo: CommentRepository,
    private readonly authors: CommentAuthorService,
  ) {}

  /** Comment của một target, cũ trước mới sau; FE tự gom trả lời theo parent_comment_id. */
  async execute(query: ListCommentsQuery): Promise<CommentResponseDto[]> {
    // findByTarget đã bỏ comment xóa mềm
    const comments = await this.commentRepo.findByTarget(
      query.targetType,
      query.targetId,
    );

    const visibleIds = new Set(comments.map((comment) => comment.getId()));

    // Trả lời của comment gốc đã xóa cũng ẩn theo
    const visible = comments.filter((comment) => {
      const parentId = comment.getParentCommentId();

      return parentId === null || visibleIds.has(parentId);
    });

    const authors = await this.authors.findAuthors(
      visible.map((comment) => comment.getAuthorId()),
    );

    return visible.map((comment) =>
      CommentResponseDto.fromDomain(
        comment,
        authors.get(comment.getAuthorId()) ?? null,
      ),
    );
  }
}
