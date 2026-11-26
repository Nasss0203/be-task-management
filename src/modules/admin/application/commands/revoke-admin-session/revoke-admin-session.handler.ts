import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { ADMIN_TYPES } from '../../../admin.types';
import type {
  AdminSessionWriter,
  RevokedAdminSession,
  RevokedAdminUserSessions,
} from '../../ports/admin-session-writer.port';
import {
  RevokeAdminSessionCommand,
  RevokeAdminUserSessionsCommand,
} from './revoke-admin-session.command';

@Injectable()
export class RevokeAdminSessionHandler {
  constructor(
    @Inject(ADMIN_TYPES.ports.SessionWriter)
    private readonly writer: AdminSessionWriter,
  ) {}

  async execute(
    command: RevokeAdminSessionCommand,
  ): Promise<RevokedAdminSession> {
    const outcome = await this.writer.revokeSession({
      sessionId: command.sessionId,
      actor: { userId: command.actorUserId, ...command.client },
    });

    if (outcome.kind === 'NOT_FOUND') {
      throw new NotFoundException('Session not found');
    }

    if (outcome.kind === 'UNCHANGED') {
      throw new ConflictException('Session is already revoked or expired');
    }

    return outcome.session;
  }
}

@Injectable()
export class RevokeAdminUserSessionsHandler {
  constructor(
    @Inject(ADMIN_TYPES.ports.SessionWriter)
    private readonly writer: AdminSessionWriter,
  ) {}

  async execute(
    command: RevokeAdminUserSessionsCommand,
  ): Promise<RevokedAdminUserSessions> {
    const result = await this.writer.revokeUserSessions({
      userId: command.userId,
      actor: { userId: command.actorUserId, ...command.client },
    });

    if (!result) {
      throw new NotFoundException('User not found');
    }

    return result;
  }
}
