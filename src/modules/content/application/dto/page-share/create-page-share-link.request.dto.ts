import { IsEnum, IsISO8601, IsOptional } from 'class-validator';

import { ResourceAccessLevel } from '../../../domain/constants/resource-access-level.constant';

export class CreatePageShareLinkRequestDto {
  @IsEnum(ResourceAccessLevel)
  access_level: ResourceAccessLevel;

  @IsOptional()
  @IsISO8601()
  expires_at?: string;
}
