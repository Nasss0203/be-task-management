import { SetMetadata } from '@nestjs/common';
import { SystemRole } from 'src/modules/users/domain/entities/user.entity';

export const SYSTEM_ROLES_KEY = 'system_roles';

export const RequireSystemRoles = (...roles: SystemRole[]) =>
  SetMetadata(SYSTEM_ROLES_KEY, roles);
