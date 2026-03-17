export class UserRoleModel {
  constructor(
    public readonly user_id: string,
    public readonly workspace_id: string,
    public readonly role_id: string,
    public readonly assigned_at: Date,
    public readonly assigned_by: string,
    public readonly revoked_at: Date | null,
  ) {}
}
