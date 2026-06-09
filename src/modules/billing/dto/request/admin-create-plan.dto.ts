import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

import { PlanBillingInterval } from '../../domain/entities/plan.entity';

export class AdminCreatePlanDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  slug: string;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsNumber()
  @Min(0)
  priceAmount: number;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  currency?: string;

  @IsEnum(PlanBillingInterval)
  billingInterval: PlanBillingInterval;

  @IsOptional()
  @IsObject()
  features?: Record<string, unknown> | null;

  @IsOptional()
  @IsObject()
  limits?: Record<string, unknown> | null;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsInt()
  sortOrder?: number;
}
