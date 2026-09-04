import { SystemRole } from 'src/modules/identity/domain/enums/system-role.enum';

export class AdminUserRoleResponseDto {
  id: string;
  systemRole: SystemRole;
  updatedAt: Date;
}
