import { NotFoundException } from '@nestjs/common';

import { CommentTargetType } from 'src/modules/comments/domain/enums/comment-target-type.enum';
import { PERMISSIONS } from 'src/modules/permission/constants/permission.constant';

import { ReplyFromSlackCommand } from './reply-from-slack.command';
import {
  ReplyFromSlackHandler,
  SLACK_REPLY_SUBMISSION_TTL_MS,
} from './reply-from-slack.handler';

describe('ReplyFromSlackHandler', () => {
  const connectionRepository = { findBySlackUser: jest.fn() };
  const comments = { findById: jest.fn() };
  const authorization = { authorize: jest.fn() };
  const createComment = { execute: jest.fn() };
  const submissionLock = { acquire: jest.fn(), release: jest.fn() };
  const handler = new ReplyFromSlackHandler(
    connectionRepository as never,
    comments as never,
    authorization as never,
    createComment as never,
    submissionLock,
  );
  const comment = (parentCommentId: string | null = null) => ({
    getId: () => 'comment-1',
    getPageId: () => 'page-1',
    getTargetType: () => CommentTargetType.PAGE,
    getTargetId: () => 'page-1',
    getParentCommentId: () => parentCommentId,
    isDeleted: () => false,
  });
  const reply = (body = '  Looks good  ') =>
    handler.execute(
      new ReplyFromSlackCommand('T1', 'U1', 'V1', 'comment-1', body),
    );

  beforeEach(() => {
    jest.clearAllMocks();
    connectionRepository.findBySlackUser.mockResolvedValue({
      userId: 'user-1',
    });
    comments.findById.mockResolvedValue(comment());
    authorization.authorize.mockResolvedValue(true);
    submissionLock.acquire.mockResolvedValue(true);
  });

  it('posts the reply as the connected user under the comment', async () => {
    await expect(reply()).resolves.toEqual({ ok: true });

    expect(connectionRepository.findBySlackUser).toHaveBeenCalledWith(
      'T1',
      'U1',
    );
    expect(authorization.authorize).toHaveBeenCalledWith({
      userId: 'user-1',
      permissions: [PERMISSIONS.PAGE_COMMENT_CREATE],
      target: { type: 'page', id: 'page-1' },
    });
    expect(createComment.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        targetType: CommentTargetType.PAGE,
        targetId: 'page-1',
        authorId: 'user-1',
        body: 'Looks good',
        parentCommentId: 'comment-1',
      }),
    );
  });

  it('keeps replies one level deep by answering in the parent thread', async () => {
    comments.findById.mockResolvedValue(comment('parent-1'));

    await reply();

    expect(createComment.execute).toHaveBeenCalledWith(
      expect.objectContaining({ parentCommentId: 'parent-1' }),
    );
  });

  it.each([
    ['the reply is empty', () => reply('   ')],
    [
      'the Slack user is not connected',
      () => {
        connectionRepository.findBySlackUser.mockResolvedValue(null);
        return reply();
      },
    ],
    [
      'the comment was deleted',
      () => {
        comments.findById.mockResolvedValue({
          ...comment(),
          isDeleted: () => true,
        });
        return reply();
      },
    ],
    [
      'the user lost access to the page',
      () => {
        authorization.authorize.mockResolvedValue(false);
        return reply();
      },
    ],
  ])('posts nothing when %s', async (_label, run) => {
    await expect(run()).resolves.toEqual(
      expect.objectContaining({ ok: false }),
    );
    expect(createComment.execute).not.toHaveBeenCalled();
    expect(submissionLock.acquire).not.toHaveBeenCalled();
  });

  it('holds the submitted modal for a minute while posting', async () => {
    await reply();

    expect(submissionLock.acquire).toHaveBeenCalledWith(
      'slack:reply:T1:V1',
      SLACK_REPLY_SUBMISSION_TTL_MS,
    );
    expect(submissionLock.release).not.toHaveBeenCalled();
  });

  it('posts once when the same modal is submitted twice', async () => {
    submissionLock.acquire.mockResolvedValue(false);

    await expect(reply()).resolves.toEqual({ ok: true });

    expect(createComment.execute).not.toHaveBeenCalled();
  });

  it('turns a rejected comment into a message for the modal', async () => {
    createComment.execute.mockRejectedValue(
      new NotFoundException('Parent comment not found'),
    );

    await expect(reply()).resolves.toEqual({
      ok: false,
      error: 'This comment can no longer be replied to.',
    });
    expect(submissionLock.release).toHaveBeenCalledWith('slack:reply:T1:V1');
  });

  it('lets the user submit again after an unexpected failure', async () => {
    const error = new Error('db down');
    createComment.execute.mockRejectedValue(error);

    await expect(reply()).rejects.toBe(error);

    expect(submissionLock.release).toHaveBeenCalledWith('slack:reply:T1:V1');
  });
});
