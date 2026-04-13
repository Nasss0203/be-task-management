import { IsEmail, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { RoleName } from 'src/modules/role/domain/entities/role.entity';

export class CreateWorkspaceInviteDto {
  @IsOptional()
  @IsUUID()
  user_id?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsEnum(RoleName)
  role_name: RoleName;

  workspaceId: string;
}
