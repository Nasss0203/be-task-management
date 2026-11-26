import type { AdminRequestClient } from '../../../domain/audit/admin-action';

export class DisableAdminPublishedSiteCommand {
  constructor(
    public readonly actorUserId: string,
    public readonly siteId: string,
    public readonly reason: string,
    public readonly client: AdminRequestClient = {},
  ) {}
}
