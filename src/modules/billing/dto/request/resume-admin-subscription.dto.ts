import { IsOptional, IsString } from 'class-validator';

export class ResumeAdminSubscriptionDto {
  @IsOptional()
  @IsString()
  note?: string;
}
