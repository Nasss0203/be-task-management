import { SystemRole } from './domain/enums/system-role.enum';

export interface IUserJwtPayload {
  sub: string;
  id: string;
  email: string;
  username: string;
  systemRole: SystemRole;
}
