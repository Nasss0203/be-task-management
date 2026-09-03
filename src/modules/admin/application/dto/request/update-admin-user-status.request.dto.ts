import { IsBoolean } from 'class-validator';

export class UpdateAdminUserStatusRequestDto {
  @IsBoolean()
  isActive: boolean;
}
