import type { SystemRole } from 'src/modules/identity/domain/enums/system-role.enum';

export class UpdateAdminUserRoleCommand {
  constructor(
    public readonly actorUserId: string,
    public readonly targetUserId: string,
    public readonly systemRole: SystemRole,
  ) {}
}
