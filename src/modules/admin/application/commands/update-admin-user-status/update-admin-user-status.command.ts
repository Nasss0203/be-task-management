export class UpdateAdminUserStatusCommand {
  constructor(
    public readonly actorUserId: string,
    public readonly targetUserId: string,
    public readonly isActive: boolean,
  ) {}
}
