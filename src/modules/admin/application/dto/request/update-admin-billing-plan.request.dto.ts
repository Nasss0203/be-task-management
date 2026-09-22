import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDefined,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class UpdateAdminBillingPlanFeatureRequestDto {
  @IsUUID()
  featureId: string;

  /*
   * Kiểu dữ liệu thực tế sẽ được handler kiểm tra dựa trên
   * valueType của billing feature.
   */
  @IsDefined()
  value: boolean | number | string;
}

export class UpdateAdminBillingPlanRequestDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(150)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string | null;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @ValidateNested({
    each: true,
  })
  @Type(() => UpdateAdminBillingPlanFeatureRequestDto)
  features?: UpdateAdminBillingPlanFeatureRequestDto[];
}
