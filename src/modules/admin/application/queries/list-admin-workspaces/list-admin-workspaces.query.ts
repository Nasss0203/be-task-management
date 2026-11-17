import { AdminWorkspaceStatusFilter } from '../../ports/admin-workspace-reader.port';

export class ListAdminWorkspacesQuery {
  constructor(
    public readonly page: number,
    public readonly limit: number,
    public readonly search?: string,
    public readonly status?: AdminWorkspaceStatusFilter,
  ) {}
}
