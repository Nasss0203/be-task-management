export class WorkspaceOwnerSummaryModel {
  constructor(
    public readonly id: string,
    public readonly username: string,
    public readonly email: string,
  ) {}
}

export class WorkspaceMemberSummaryModel {
  constructor(
    public readonly workspaceId: string,
    public readonly owner: WorkspaceOwnerSummaryModel | null,
    public readonly memberCount: number,
    public readonly inviteCount: number,
  ) {}
}
