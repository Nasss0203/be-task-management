export class PermissionModel {
  constructor(
    public readonly id: string,
    public readonly code: string,
    public readonly description: string | null,
    public readonly created_at: Date,
  ) {}
}
