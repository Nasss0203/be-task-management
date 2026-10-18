import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

import { TemplateEntitlementSource } from '../../../domain/enums/template-entitlement-source.enum';

export class GetMyClaimedTemplatesRequest {
  @IsOptional()
  @IsString()
  cursor?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @IsEnum(TemplateEntitlementSource)
  source?: TemplateEntitlementSource;
}
