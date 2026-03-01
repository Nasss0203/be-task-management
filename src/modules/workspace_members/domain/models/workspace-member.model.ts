export class WorkspaceMemberModel {
  constructor(
    public readonly id: string,
    public readonly workspace_id: string,
    public readonly user_id: string,
    public readonly role_id: string,
    public readonly joinedAt?: Date,
  ) {}
}
