import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Comment } from 'src/modules/comments/domain/aggregates/comment/comment.aggregate';
import { CommentTargetType } from 'src/modules/comments/domain/enums/comment-target-type.enum';
import type { CommentRepository } from 'src/modules/comments/domain/repositories/comment.repository';
import { CommentAuthorService } from '../../services/comment-author.service';
import { CommentNotificationService } from '../../services/comment-notification.service';
import type { CommentTargetResolver } from '../../ports/comment-target-resolver.port';
import { ListCommentsHandler } from '../../queries/comment/list-comments/list-comments.handler';
import { ListCommentsQuery } from '../../queries/comment/list-comments/list-comments.query';
import { CreateCommentCommand } from './create-comment/create-comment.command';
import { CreateCommentHandler } from './create-comment/create-comment.handler';
import { DeleteCommentCommand } from './delete-comment/delete-comment.command';
import { DeleteCommentHandler } from './delete-comment/delete-comment.handler';
import { UpdateCommentCommand } from './update-comment/update-comment.command';
import { UpdateCommentHandler } from './update-comment/update-comment.handler';

function comment(
  id: string,
  overrides: Partial<{
    parentCommentId: string | null;
    authorId: string;
    targetId: string;
  }> = {},
): Comment {
  return Comment.restore({
    id,
    workspaceId: 'ws-1',
    pageId: 'page-1',
    targetType: CommentTargetType.PAGE,
    targetId: overrides.targetId ?? 'page-1',
    parentCommentId: overrides.parentCommentId ?? null,
    authorId: overrides.authorId ?? 'user-1',
    body: `body ${id}`,
    resolvedAt: null,
    resolvedBy: null,
    editedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  });
}

function setup(existing: Comment[] = []) {
  const commentRepo = {
    save: jest.fn((saved: Comment) => Promise.resolve(saved)),
    findById: jest.fn((id: string) =>
      Promise.resolve(existing.find((item) => item.getId() === id) ?? null),
    ),
    findByTarget: jest.fn(() => Promise.resolve(existing)),
  };
  const locations: Record<string, { pageId: string; workspaceId: string }> = {
    [`${CommentTargetType.PAGE}:page-1`]: {
      pageId: 'page-1',
      workspaceId: 'ws-1',
    },
    [`${CommentTargetType.DATABASE_ROW}:row-1`]: {
      pageId: 'page-db',
      workspaceId: 'ws-1',
    },
  };
  const targets = {
    resolve: jest.fn((type: CommentTargetType, id: string) =>
      Promise.resolve(locations[`${type}:${id}`] ?? null),
    ),
  } as unknown as CommentTargetResolver;
  const authors = {
    findAuthors: jest.fn((ids: string[]) =>
      Promise.resolve(
        new Map(ids.map((id) => [id, { id, username: id, email: `${id}@x` }])),
      ),
    ),
  } as unknown as CommentAuthorService;

  const repo = commentRepo as unknown as CommentRepository;
  const notifier = { afterSave: jest.fn(() => Promise.resolve()) };
  const commentNotifications =
    notifier as unknown as CommentNotificationService;

  return {
    commentRepo,
    notifier,
    create: new CreateCommentHandler(
      repo,
      targets,
      authors,
      commentNotifications,
    ),
    update: new UpdateCommentHandler(repo, authors, commentNotifications),
    remove: new DeleteCommentHandler(repo),
    list: new ListCommentsHandler(repo, authors),
  };
}

describe('comment commands', () => {
  it('creates a page comment in the page workspace with its author', async () => {
    const { create, commentRepo } = setup();

    const result = await create.execute(
      new CreateCommentCommand(
        CommentTargetType.PAGE,
        'page-1',
        'user-1',
        'Hello',
      ),
    );

    const saved = commentRepo.save.mock.calls[0][0];
    expect(saved.getWorkspaceId()).toBe('ws-1');
    expect(saved.getTargetType()).toBe(CommentTargetType.PAGE);
    expect(saved.getTargetId()).toBe('page-1');
    expect(result.author?.id).toBe('user-1');
    expect(result.body).toBe('Hello');
  });

  it('rejects a missing page', async () => {
    const { create } = setup();

    await expect(
      create.execute(
        new CreateCommentCommand(
          CommentTargetType.PAGE,
          'page-x',
          'user-1',
          'Hi',
        ),
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('stores a row comment under the page that holds the database', async () => {
    const pageComment = comment('c-page');
    const { create, commentRepo } = setup([pageComment]);

    await create.execute(
      new CreateCommentCommand(
        CommentTargetType.DATABASE_ROW,
        'row-1',
        'user-1',
        'On it',
      ),
    );

    const saved = commentRepo.save.mock.calls[0][0];
    expect(saved.getTargetType()).toBe(CommentTargetType.DATABASE_ROW);
    expect(saved.getTargetId()).toBe('row-1');
    expect(saved.getPageId()).toBe('page-db');

    // Không trả lời chéo sang comment của target khác
    await expect(
      create.execute(
        new CreateCommentCommand(
          CommentTargetType.DATABASE_ROW,
          'row-1',
          'user-1',
          'x',
          'c-page',
        ),
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('only allows one level of replies on the same page', async () => {
    const root = comment('c-root');
    const reply = comment('c-reply', { parentCommentId: 'c-root' });
    const otherPage = comment('c-other', { targetId: 'page-2' });
    const { create, notifier } = setup([root, reply, otherPage]);

    await expect(
      create.execute(
        new CreateCommentCommand(
          CommentTargetType.PAGE,
          'page-1',
          'user-2',
          'ok',
          'c-root',
        ),
      ),
    ).resolves.toMatchObject({ parent_comment_id: 'c-root' });

    // Báo cho tác giả comment gốc (và đồng bộ mention) sau khi lưu
    expect(notifier.afterSave).toHaveBeenCalledWith(
      expect.objectContaining({}),
      'user-2',
      root,
    );

    await expect(
      create.execute(
        new CreateCommentCommand(
          CommentTargetType.PAGE,
          'page-1',
          'user-2',
          'deep',
          'c-reply',
        ),
      ),
    ).rejects.toBeInstanceOf(BadRequestException);

    await expect(
      create.execute(
        new CreateCommentCommand(
          CommentTargetType.PAGE,
          'page-1',
          'user-2',
          'x',
          'c-other',
        ),
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('lets only the author edit and delete', async () => {
    const own = comment('c-1', { authorId: 'user-1' });
    const { update, remove } = setup([own]);

    await expect(
      update.execute(new UpdateCommentCommand('c-1', 'user-2', 'hack')),
    ).rejects.toBeInstanceOf(ForbiddenException);
    await expect(
      remove.execute(new DeleteCommentCommand('c-1', 'user-2')),
    ).rejects.toBeInstanceOf(ForbiddenException);

    const edited = await update.execute(
      new UpdateCommentCommand('c-1', 'user-1', 'fixed'),
    );
    expect(edited.body).toBe('fixed');
    expect(edited.edited_at).toBeInstanceOf(Date);

    await remove.execute(new DeleteCommentCommand('c-1', 'user-1'));
    expect(own.isDeleted()).toBe(true);
  });

  it('hides replies whose root comment was deleted', async () => {
    const orphan = comment('c-orphan', { parentCommentId: 'c-gone' });
    const root = comment('c-root');
    const reply = comment('c-reply', { parentCommentId: 'c-root' });
    const { list } = setup([root, reply, orphan]);

    const result = await list.execute(
      new ListCommentsQuery(CommentTargetType.PAGE, 'page-1'),
    );

    expect(result.map((item) => item.id)).toEqual(['c-root', 'c-reply']);
  });
});
