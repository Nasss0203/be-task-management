import { IsISO8601, IsOptional } from 'class-validator';

export class CreatePageShareLinkRequestDto {
  @IsOptional()
  @IsISO8601()
  expires_at?: string;
}
