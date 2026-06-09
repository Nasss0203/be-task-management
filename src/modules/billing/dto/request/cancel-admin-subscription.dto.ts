import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class CancelAdminSubscriptionDto {
  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsBoolean()
  immediate?: boolean;
}
