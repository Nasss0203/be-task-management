import { IsEnum, IsInt, IsObject, IsString, IsUUID, Max, Min, ValidateIf } from 'class-validator';
import { TemplateOfferType } from '../../../domain/enums/template-offer-type.enum';
import { TemplatePreviewMode } from '../../../domain/enums/template-preview-mode.enum';

export class CreateTemplateListingRequest {
  @ValidateIf((_, value) => value !== undefined)
  @IsEnum(TemplateOfferType)
  offer_type?: TemplateOfferType;

  @ValidateIf((_, value) => value !== undefined)
  @IsInt()
  @Min(0)
  @Max(Number.MAX_SAFE_INTEGER)
  price_amount?: number;

  @ValidateIf((_, value) => value !== undefined)
  @IsString()
  currency?: string;

  @ValidateIf((_, value) => value !== undefined)
  @IsEnum(TemplatePreviewMode)
  preview_mode?: TemplatePreviewMode;

  @ValidateIf((_, value) => value !== undefined)
  @IsUUID()
  demo_version_id?: string;

  @ValidateIf((_, value) => value !== undefined)
  @IsObject()
  demo_config?: Record<string, any>;
}
