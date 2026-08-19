export class SearchInviteUsersQuery {
  constructor(
    public readonly workspaceId: string,
    public readonly keyword: string | undefined,
    public readonly currentUserId: string,
  ) {}
}
