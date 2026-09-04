import { SystemRole } from 'src/modules/identity/domain/enums/system-role.enum';
import type { AdminPermissionCode } from '../../../domain/permissions/admin-permission-code';

export class AdminAccessResponseDto {
  userId: string;
  systemRole: SystemRole;
  permissions: readonly AdminPermissionCode[];
}
