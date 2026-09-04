import { SystemRole } from 'src/modules/identity/domain/enums/system-role.enum';

export interface AdminActorProps {
  userId: string;
  systemRole: SystemRole;
}

export class AdminActor {
  readonly userId: string;
  readonly systemRole: SystemRole;

  constructor({ userId, systemRole }: AdminActorProps) {
    this.userId = userId;
    this.systemRole = systemRole;
  }
}
