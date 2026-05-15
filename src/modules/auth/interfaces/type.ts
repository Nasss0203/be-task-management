import { SystemRole } from 'src/modules/users/domain/entities/user.entity';

export interface IUserJwtPayload {
  sub: string;
  id: string;
  email: string;
  username: string;
  systemRole: SystemRole;
}
