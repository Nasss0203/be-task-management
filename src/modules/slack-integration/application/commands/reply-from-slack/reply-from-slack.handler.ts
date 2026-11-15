import { HttpException, Inject, Injectable } from '@nestjs/common';

import { CreateCommentCommand } from 'src/modules/comments/application/commands/comment/create-comment/create-comment.command';
import { CreateCommentHandler } from 'src/modules/comments/application/commands/comment/create-comment/create-comment.handler';
import { COMMENT_BODY_MAX_LENGTH } from 'src/modules/comments/application/dto/comment/request/create-comment.request.dto';
import { COMMENT_TYPES } from 'src/modules/comments/comments.types';
import type { CommentRepository } from 'src/modules/comments/domain/repositories/comment.repository';
import { AuthorizationService } from 'src/modules/permission/application/services/authorization.service';
import { PERMISSIONS } from 'src/modules/permission/constants/permission.constant';

import type { SlackConnectionRepository } from '../../../domain/repositories/slack-connection.repository';
import { SLACK_INTEGRATION_TYPES } from '../../../slack-integration.types';
import type { SlackSubmissionLock } from '../../ports/slack-submission-lock.port';
import { ReplyFromSlackCommand } from './reply-from-slack.command';

export const SLACK_REPLY_SUBMISSION_TTL_MS = 60_000;

export type ReplyFromSlackResult = { ok: true } | { ok: false; error: string };

const fail = (error: string): ReplyFromSlackResult => ({ ok: false, error });

@Injectable()
export class ReplyFromSlackHandler {
  constructor(
    @Inject(SLACK_INTEGRATION_TYPES.repositories.SlackConnectionRepository)
    private readonly connectionRepository: SlackConnectionRepository,

    @Inject(COMMENT_TYPES.repositories.CommentRepository)
    private readonly comments: CommentRepository,

    private readonly authorization: AuthorizationService,

    private readonly createComment: CreateCommentHandler,

    @Inject(SLACK_INTEGRATION_TYPES.ports.SlackSubmissionLock)
    private readonly submissionLock: SlackSubmissionLock,
  ) {}

  async execute(command: ReplyFromSlackCommand): Promise<ReplyFromSlackResult> {
    const body = command.body.trim();

    if (!body) {
      return fail('Write a reply first.');
    }

    if (body.length > COMMENT_BODY_MAX_LENGTH) {
      return fail(
        `Replies can be up to ${COMMENT_BODY_MAX_LENGTH} characters.`,
      );
    }

    const connection = await this.connectionRepository.findBySlackUser(
      command.slackTeamId,
      command.slackUserId,
    );

    if (!connection) {
      return fail('Connect Slack in Taskmanly settings first.');
    }

    const comment = await this.comments.findById(command.commentId);

    if (!comment || comment.isDeleted()) {
      return fail('This comment was deleted.');
    }

    const allowed = await this.authorization.authorize({
      userId: connection.userId,
      permissions: [PERMISSIONS.PAGE_COMMENT_CREATE],
      target: { type: 'page', id: comment.getPageId() },
    });

    if (!allowed) {
      return fail('You can no longer comment on this page.');
    }

    const submissionKey = `slack:reply:${command.slackTeamId}:${command.viewId}`;

    if (
      !(await this.submissionLock.acquire(
        submissionKey,
        SLACK_REPLY_SUBMISSION_TTL_MS,
      ))
    ) {
      return { ok: true };
    }

    try {
      await this.createComment.execute(
        new CreateCommentCommand(
          comment.getTargetType(),
          comment.getTargetId(),
          connection.userId,
          body,
          comment.getParentCommentId() ?? comment.getId(),
        ),
      );
    } catch (error) {
      await this.submissionLock.release(submissionKey);
      if (error instanceof HttpException) {
        return fail('This comment can no longer be replied to.');
      }
      throw error;
    }

    return { ok: true };
  }
}
