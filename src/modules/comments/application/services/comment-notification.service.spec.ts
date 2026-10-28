import { Comment } from 'src/modules/comments/domain/aggregates/comment/comment.aggregate';
import { CommentTargetType } from 'src/modules/comments/domain/enums/comment-target-type.enum';
import { commentActionUrl } from './comment-notification.service';

const at = (targetType: CommentTargetType, targetId: string) =>
  Comment.create({
    workspaceId: 'ws-1',
    pageId: 'page-1',
    targetType,
    targetId,
    authorId: 'user-1',
    body: 'x',
  });

describe('commentActionUrl', () => {
  it('opens exactly where the comment lives', () => {
    expect(commentActionUrl(at(CommentTargetType.PAGE, 'page-1'))).toBe(
      '/page/page-1',
    );
    expect(commentActionUrl(at(CommentTargetType.PAGE_BLOCK, 'block-1'))).toBe(
      '/page/page-1#block-block-1',
    );
    expect(commentActionUrl(at(CommentTargetType.DATABASE_ROW, 'row-1'))).toBe(
      '/page/page-1?row=row-1',
    );
  });
});
