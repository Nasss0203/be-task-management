import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { SystemRole } from 'src/modules/identity/domain/enums/system-role.enum';

import type {
  AdminSessionItem,
  AdminSessionReader,
  AdminSessionsOverview,
  AdminUserIpHistory,
  ListAdminSessionsInput,
  ListAdminSessionsResult,
} from '../../../../application/ports/admin-session-reader.port';

interface SessionRawRow {
  id: string;
  userId: string;
  username: string;
  email: string;
  systemRole: SystemRole;
  ipAddress: string | null;
  userAgent: string | null;
  lastActiveAt: Date | string;
  expiresAt: Date | string;
}

interface IpHistoryRawRow {
  ipAddress: string | null;
  userAgent: string | null;
  firstSeenAt: Date | string;
  lastSeenAt: Date | string;
  tokensIssued: number | string;
  hasOpenSession: boolean;
}

const IP_HISTORY_DAYS = 90;

const IP_HISTORY_LIMIT = 50;

const ACTIVE_SESSION = `
  refresh_token.revoked_at IS NULL
  AND refresh_token.expires_at > now()
`;

const SESSIONS_FROM = `
  FROM refresh_tokens refresh_token
  INNER JOIN users token_owner ON token_owner.id = refresh_token.user_id
  WHERE ${ACTIVE_SESSION}
    AND (
      $1::text IS NULL
      OR token_owner.email ILIKE '%' || $1 || '%'
      OR token_owner.username ILIKE '%' || $1 || '%'
    )
    AND ($2::text IS NULL OR token_owner.system_role::text = $2)
    AND ($3::uuid IS NULL OR refresh_token.user_id = $3)
`;

@Injectable()
export class TypeOrmAdminSessionReader implements AdminSessionReader {
  constructor(private readonly dataSource: DataSource) {}

  async getOverview(): Promise<AdminSessionsOverview> {
    const rows = await this.dataSource.query<
      Array<Record<keyof AdminSessionsOverview, number | string>>
    >(
      `
        SELECT
          COUNT(*)::int AS "activeSessions",
          COUNT(DISTINCT refresh_token.user_id)::int AS "usersWithSessions",
          COUNT(*) FILTER (
            WHERE token_owner.system_role::text <> $1
          )::int AS "adminSessions"
        FROM refresh_tokens refresh_token
        INNER JOIN users token_owner ON token_owner.id = refresh_token.user_id
        WHERE ${ACTIVE_SESSION}
      `,
      [SystemRole.USER],
    );
    const row = rows[0];

    return {
      activeSessions: Number(row?.activeSessions ?? 0),
      usersWithSessions: Number(row?.usersWithSessions ?? 0),
      adminSessions: Number(row?.adminSessions ?? 0),
    };
  }

  async listSessions(
    input: ListAdminSessionsInput,
  ): Promise<ListAdminSessionsResult> {
    const page = Number.isFinite(input.page)
      ? Math.max(1, Math.floor(input.page))
      : 1;
    const limit = Number.isFinite(input.limit)
      ? Math.min(100, Math.max(1, Math.floor(input.limit)))
      : 20;
    const filters = [
      input.search?.trim() || null,
      input.systemRole ?? null,
      input.userId ?? null,
    ];

    const rows = await this.dataSource.query<SessionRawRow[]>(
      `
        SELECT
          refresh_token.id AS "id",
          token_owner.id AS "userId",
          token_owner.username AS "username",
          token_owner.email AS "email",
          token_owner.system_role AS "systemRole",
          host(refresh_token.ip_address) AS "ipAddress",
          refresh_token.user_agent AS "userAgent",
          refresh_token.created_at AS "lastActiveAt",
          refresh_token.expires_at AS "expiresAt"
        ${SESSIONS_FROM}
        ORDER BY refresh_token.created_at DESC, refresh_token.id
        LIMIT $4
        OFFSET $5
      `,
      [...filters, limit, (page - 1) * limit],
    );

    const countRows = await this.dataSource.query<
      Array<{ total: number | string }>
    >(`SELECT COUNT(*) AS total ${SESSIONS_FROM}`, filters);

    return {
      items: rows.map((row) => this.toItem(row)),
      total: Number(countRows[0]?.total ?? 0),
      page,
      limit,
    };
  }

  async getUserIpHistory(userId: string): Promise<AdminUserIpHistory | null> {
    const users = await this.dataSource.query<
      Array<{ id: string; since: Date | string }>
    >(
      `
        SELECT id, now() - make_interval(days => $2) AS "since"
        FROM users
        WHERE id = $1
      `,
      [userId, IP_HISTORY_DAYS],
    );
    const user = users[0];

    if (!user) {
      return null;
    }

    const rows = await this.dataSource.query<IpHistoryRawRow[]>(
      `
        SELECT
          host(refresh_token.ip_address) AS "ipAddress",
          refresh_token.user_agent AS "userAgent",
          MIN(refresh_token.created_at) AS "firstSeenAt",
          MAX(refresh_token.created_at) AS "lastSeenAt",
          COUNT(*)::int AS "tokensIssued",
          BOOL_OR(${ACTIVE_SESSION}) AS "hasOpenSession"
        FROM refresh_tokens refresh_token
        WHERE refresh_token.user_id = $1
          AND refresh_token.created_at >= now() - make_interval(days => $2)
        GROUP BY refresh_token.ip_address, refresh_token.user_agent
        ORDER BY MAX(refresh_token.created_at) DESC
        LIMIT $3
      `,
      [userId, IP_HISTORY_DAYS, IP_HISTORY_LIMIT],
    );

    return {
      userId: user.id,
      since: new Date(user.since),
      items: rows.map((row) => ({
        ipAddress: row.ipAddress,
        userAgent: row.userAgent,
        firstSeenAt: new Date(row.firstSeenAt),
        lastSeenAt: new Date(row.lastSeenAt),
        tokensIssued: Number(row.tokensIssued),
        hasOpenSession: row.hasOpenSession === true,
      })),
    };
  }

  private toItem(row: SessionRawRow): AdminSessionItem {
    return {
      id: row.id,
      user: {
        id: row.userId,
        username: row.username,
        email: row.email,
        systemRole: row.systemRole,
      },
      ipAddress: row.ipAddress,
      userAgent: row.userAgent,
      lastActiveAt: new Date(row.lastActiveAt),
      expiresAt: new Date(row.expiresAt),
    };
  }
}
