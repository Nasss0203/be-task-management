import type { AdminActionActor } from '../../domain/audit/admin-action';

export interface RevokeAdminSessionInput {
  sessionId: string;
  actor: AdminActionActor;
}

export interface RevokeAdminUserSessionsInput {
  userId: string;
  actor: AdminActionActor;
}

export interface RevokedAdminSession {
  id: string;
  userId: string;
  revokedAt: Date;
}

export interface RevokedAdminUserSessions {
  userId: string;
  revoked: number;
}

export type RevokeAdminSessionOutcome =
  | { kind: 'NOT_FOUND' }
  | { kind: 'UNCHANGED' }
  | { kind: 'DONE'; session: RevokedAdminSession };

export interface AdminSessionWriter {
  revokeSession(
    input: RevokeAdminSessionInput,
  ): Promise<RevokeAdminSessionOutcome>;

  revokeUserSessions(
    input: RevokeAdminUserSessionsInput,
  ): Promise<RevokedAdminUserSessions | null>;
}
