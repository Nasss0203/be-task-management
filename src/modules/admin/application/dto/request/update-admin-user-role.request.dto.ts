import { IsEnum } from 'class-validator';
import { SystemRole } from 'src/modules/identity/domain/enums/system-role.enum';

export class UpdateAdminUserRoleRequestDto {
  @IsEnum(SystemRole)
  systemRole: SystemRole;
}
