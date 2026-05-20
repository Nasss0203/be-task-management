import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { SystemRole } from 'src/modules/users/domain/entities/user.entity';

export enum AdminUserStatus {
  ACTIVE = 'ACTIVE',
  LOCKED = 'LOCKED',
}

export class AdminFindAllUserQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(AdminUserStatus)
  status?: AdminUserStatus;

  @IsOptional()
  @IsEnum(SystemRole)
  role?: SystemRole;

  @IsOptional()
  @IsDateString()
  createdAt?: string;
}
