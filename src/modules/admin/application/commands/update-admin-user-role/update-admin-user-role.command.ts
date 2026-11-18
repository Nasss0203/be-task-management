import type { SystemRole } from 'src/modules/identity/domain/enums/system-role.enum';
import type { AdminRequestClient } from '../../../domain/audit/admin-action';

export class UpdateAdminUserRoleCommand {
  constructor(
    public readonly actorUserId: string,
    public readonly targetUserId: string,
    public readonly systemRole: SystemRole,
    public readonly client: AdminRequestClient = {},
  ) {}
}
