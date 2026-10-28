import { Inject, Injectable } from '@nestjs/common';
import { COMMENT_TYPES } from 'src/modules/comments/comments.types';
import { CommentTargetType } from 'src/modules/comments/domain/enums/comment-target-type.enum';
import type { CommentRepository } from 'src/modules/comments/domain/repositories/comment.repository';
import { CountBlockCommentsQuery } from './count-block-comments.query';

@Injectable()
export class CountBlockCommentsHandler {
  constructor(
    @Inject(COMMENT_TYPES.repositories.CommentRepository)
    private readonly commentRepo: CommentRepository,
  ) {}

  /** `{ [blockId]: số comment }` cho mọi block có comment trong page; block không có thì không có key. */
  execute(query: CountBlockCommentsQuery): Promise<Record<string, number>> {
    return this.commentRepo.countVisibleByPage(
      query.pageId,
      CommentTargetType.PAGE_BLOCK,
    );
  }
}
