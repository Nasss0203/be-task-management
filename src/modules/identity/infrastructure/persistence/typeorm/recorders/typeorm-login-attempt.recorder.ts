import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';

import type {
  LoginAttemptEntry,
  LoginAttemptRecorder,
} from '../../../../application/ports/login-attempt-recorder.port';

const MAX_TEXT_LENGTH = 255;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeAttemptedEmail(
  value: string | null | undefined,
): string | null {
  const email = value?.trim().toLowerCase();

  return email && email.length <= MAX_TEXT_LENGTH && EMAIL_PATTERN.test(email)
    ? email
    : null;
}

@Injectable()
export class TypeOrmLoginAttemptRecorder implements LoginAttemptRecorder {
  private readonly logger = new Logger(TypeOrmLoginAttemptRecorder.name);

  constructor(private readonly dataSource: DataSource) {}

  async record(entry: LoginAttemptEntry): Promise<void> {
    try {
      await this.dataSource.query(
        `
          INSERT INTO login_attempts (
            user_id,
            attempted_email,
            method,
            result,
            reason,
            ip_address,
            user_agent
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `,
        [
          entry.userId,
          normalizeAttemptedEmail(entry.attemptedEmail),
          entry.method,
          entry.result,
          entry.reason ?? null,
          entry.client?.ipAddress ?? null,
          entry.client?.userAgent?.slice(0, MAX_TEXT_LENGTH) ?? null,
        ],
      );
    } catch (error) {
      this.logger.error(
        `Failed to record ${entry.method} login attempt (${entry.result})`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }
}
