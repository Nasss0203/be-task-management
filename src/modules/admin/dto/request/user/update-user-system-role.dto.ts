import { IsEnum } from 'class-validator';
import { SystemRole } from 'src/modules/users/domain/entities/user.entity';

export class UpdateUserSystemRoleDto {
  @IsEnum(SystemRole)
  systemRole: SystemRole;
}
    