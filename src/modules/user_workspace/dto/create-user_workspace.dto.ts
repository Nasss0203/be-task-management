import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { RoleName } from 'src/modules/role/domain/entities/role.entity';

export class CreateUserWorkspaceDto {
  id?: string;
  workspace_id: string;
  user_id: string;
  joinedAt?: Date;
  lastOpenedAt?: Date;
}

export class AddWorkspaceMemberDto {
  @IsString()
  @IsNotEmpty()
  user_id: string;

  @IsEnum(RoleName)
  @IsNotEmpty()
  role_name: RoleName;
}

export class UpdateWorkspaceMemberRoleDto {
  @IsEnum(RoleName)
  @IsNotEmpty()
  role_name: RoleName;
}

export class WorkspaceMemberResponseDto {
  id: string;
  user_id: string;
  workspace_id: string;
  joined_at: Date | null;
  last_opened_at: Date | null;
  full_name: string;
  email: string;
  avatar_url?: string | null;
  role_name: RoleName;
}
