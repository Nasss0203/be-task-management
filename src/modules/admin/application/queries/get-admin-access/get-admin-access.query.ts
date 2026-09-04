import { SystemRole } from 'src/modules/identity/domain/enums/system-role.enum';

export class GetAdminAccessQuery {
  constructor(
    public readonly userId: string,
    public readonly systemRole: SystemRole,
  ) {}
}
