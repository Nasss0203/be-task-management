import type { AdminRequestClient } from '../../../domain/audit/admin-action';

export class RevokeAdminSessionCommand {
  constructor(
    public readonly actorUserId: string,
    public readonly sessionId: string,
    public readonly client: AdminRequestClient = {},
  ) {}
}

export class RevokeAdminUserSessionsCommand {
  constructor(
    public readonly actorUserId: string,
    public readonly userId: string,
    public readonly client: AdminRequestClient = {},
  ) {}
}
