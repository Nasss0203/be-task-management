import { IsEmail, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { RoleName } from 'src/modules/role/domain/entities/role.entity';

export class CreateWorkspaceInviteDto {
  @IsOptional()
  @IsUUID()
  user_id?: string;

  @IsEmail()
  email: string;

  @IsEnum(RoleName)
  role_name: RoleName;

  workspaceId: string;
}

import { IsInt, Max, Min } from 'class-validator';

export class CreateWorkspaceInviteLinkDto {
  @IsEnum(RoleName)
  role_name: RoleName;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(30)
  expires_in_days?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  max_uses?: number;
}

import { IsString, MinLength } from 'class-validator';

export class AcceptWorkspaceInviteDto {
  @IsString()
  @MinLength(16)
  token: string;
}
