import type { AdminRequestClient } from '../../../domain/audit/admin-action';

export class RestoreAdminPublishedSiteCommand {
  constructor(
    public readonly actorUserId: string,
    public readonly siteId: string,
    public readonly client: AdminRequestClient = {},
  ) {}
}
