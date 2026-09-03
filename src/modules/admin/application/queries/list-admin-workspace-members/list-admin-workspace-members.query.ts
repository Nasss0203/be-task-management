export class ListAdminWorkspaceMembersQuery {
  constructor(
    public readonly workspaceId: string,
    public readonly page: number = 1,
    public readonly limit: number = 20,
    public readonly search?: string,
  ) {}
}
