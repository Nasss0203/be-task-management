import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

import type {
  AdminSessionWriter,
  RevokeAdminSessionInput,
  RevokeAdminSessionOutcome,
  RevokeAdminUserSessionsInput,
  RevokedAdminUserSessions,
} from '../../../../application/ports/admin-session-writer.port';
import { insertAdminAction } from './typeorm-admin-action.recorder';

interface LockedSessionRow {
  id: string;
  userId: string;
  ipAddress: string | null;
  userAgent: string | null;
  open: boolean;
}

@Injectable()
export class TypeOrmAdminSessionWriter implements AdminSessionWriter {
  constructor(private readonly dataSource: DataSource) {}

  async revokeSession(
    input: RevokeAdminSessionInput,
  ): Promise<RevokeAdminSessionOutcome> {
    return this.dataSource.transaction(async (manager) => {
      const rows = await manager.query<LockedSessionRow[]>(
        `
          SELECT
            id,
            user_id AS "userId",
            host(ip_address) AS "ipAddress",
            user_agent AS "userAgent",
            (revoked_at IS NULL AND expires_at > now()) AS "open"
          FROM refresh_tokens
          WHERE id = $1
          FOR UPDATE
        `,
        [input.sessionId],
      );
      const session = rows[0];

      if (!session) {
        return { kind: 'NOT_FOUND' };
      }

      if (!session.open) {
        return { kind: 'UNCHANGED' };
      }

      const revokedAt = new Date();

      await manager.query(
        `UPDATE refresh_tokens SET revoked_at = $2 WHERE id = $1`,
        [session.id, revokedAt],
      );

      await insertAdminAction(manager, {
        actor: input.actor,
        action: 'SESSION_REVOKED',
        targetType: 'USER',
        targetId: session.userId,
        changes: {
          sessionId: session.id,
          ipAddress: session.ipAddress,
          userAgent: session.userAgent,
        },
      });

      return {
        kind: 'DONE',
        session: { id: session.id, userId: session.userId, revokedAt },
      };
    });
  }

  async revokeUserSessions(
    input: RevokeAdminUserSessionsInput,
  ): Promise<RevokedAdminUserSessions | null> {
    return this.dataSource.transaction(async (manager) => {
      const users = await manager.query<Array<{ id: string }>>(
        `SELECT id FROM users WHERE id = $1 AND deleted_at IS NULL FOR UPDATE`,
        [input.userId],
      );

      if (!users[0]) {
        return null;
      }

      const [revokedRows] = await manager.query<
        [Array<{ id: string }>, number]
      >(
        `
          UPDATE refresh_tokens
          SET revoked_at = $2
          WHERE user_id = $1
            AND revoked_at IS NULL
            AND expires_at > now()
          RETURNING id
        `,
        [input.userId, new Date()],
      );

      await insertAdminAction(manager, {
        actor: input.actor,
        action: 'USER_SESSIONS_REVOKED',
        targetType: 'USER',
        targetId: input.userId,
        changes: { revoked: revokedRows.length },
      });

      return { userId: input.userId, revoked: revokedRows.length };
    });
  }
}
