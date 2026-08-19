import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { WorkspaceRole } from 'src/shared/domain/enums/workspace-role.enum';

export enum InviteRecipientType {
  USER = 'USER',
  EMAIL = 'EMAIL',
}

export class InviteRecipientDto {
  @IsEnum(InviteRecipientType)
  type: InviteRecipientType;

  @IsOptional()
  @IsUUID()
  user_id?: string;

  @IsEmail()
  email?: string;
}

export class CreateWorkspaceInviteDto {
  @IsEnum(WorkspaceRole)
  role_name: WorkspaceRole;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => InviteRecipientDto)
  recipients: InviteRecipientDto[];
}

export class CreateWorkspaceInviteLinkDto {
  @IsEnum(WorkspaceRole)
  role_name: WorkspaceRole;

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

export class AcceptWorkspaceInviteDto {
  @IsString()
  @MinLength(16)
  token: string;
}
