import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';

import type { AdminActionRecorder } from '../../../../application/ports/admin-action-recorder.port';
import type { AdminActionEntry } from '../../../../domain/audit/admin-action';

const MAX_USER_AGENT_LENGTH = 255;

interface QueryRunnerLike {
  query(sql: string, parameters?: unknown[]): Promise<unknown>;
}

export async function insertAdminAction(
  runner: QueryRunnerLike,
  entry: AdminActionEntry,
): Promise<void> {
  await runner.query(
    `
      INSERT INTO admin_actions (
        actor_user_id,
        action,
        target_type,
        target_id,
        changes,
        ip_address,
        user_agent
      )
      VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7)
    `,
    [
      entry.actor.userId,
      entry.action,
      entry.targetType,
      entry.targetId,
      JSON.stringify(entry.changes),
      entry.actor.ipAddress ?? null,
      entry.actor.userAgent?.slice(0, MAX_USER_AGENT_LENGTH) ?? null,
    ],
  );
}

@Injectable()
export class TypeOrmAdminActionRecorder implements AdminActionRecorder {
  private readonly logger = new Logger(TypeOrmAdminActionRecorder.name);

  constructor(private readonly dataSource: DataSource) {}

  async record(entry: AdminActionEntry): Promise<void> {
    try {
      await insertAdminAction(this.dataSource, entry);
    } catch (error) {
      this.logger.error(
        `Failed to record admin action ${entry.action} by ${entry.actor.userId}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }
}
