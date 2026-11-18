import type { AdminRequestClient } from '../../../domain/audit/admin-action';

export class UpdateAdminUserStatusCommand {
  constructor(
    public readonly actorUserId: string,
    public readonly targetUserId: string,
    public readonly isActive: boolean,
    public readonly client: AdminRequestClient = {},
  ) {}
}
