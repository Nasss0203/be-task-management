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

  // null clears the demo version.
  @ValidateIf((_, value) => value !== undefined && value !== null)
  @IsUUID()
  demo_version_id?: string | null;

  // null clears the config; the schema is validated by TemplateDemoConfig.
  @ValidateIf((_, value) => value !== undefined && value !== null)
  @IsObject()
  demo_config?: Record<string, any> | null;
}
