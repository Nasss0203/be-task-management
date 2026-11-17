import type { SystemRole } from 'src/modules/identity/domain/enums/system-role.enum';

export class ListAdminUsersQuery {
  constructor(
    public readonly page: number,
    public readonly limit: number,
    public readonly search?: string,
    public readonly isActive?: boolean,
    public readonly systemRole?: SystemRole,
  ) {}
}
