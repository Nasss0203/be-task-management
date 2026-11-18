import type { SystemRole } from 'src/modules/identity/domain/enums/system-role.enum';

export class ListAdminSessionsQuery {
  constructor(
    public readonly page: number,
    public readonly limit: number,
    public readonly search?: string,
    public readonly systemRole?: SystemRole,
  ) {}
}
